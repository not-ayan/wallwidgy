import asyncio
import importlib.util
import sys
import types
import unittest
from unittest.mock import AsyncMock, MagicMock


def _install_bot_dependency_stubs():
    if importlib.util.find_spec("requests") is None:
        requests_mod = types.ModuleType("requests")
        requests_mod.get = MagicMock()
        requests_mod.patch = MagicMock()
        sys.modules["requests"] = requests_mod

    if importlib.util.find_spec("dotenv") is None:
        dotenv_mod = types.ModuleType("dotenv")
        dotenv_mod.load_dotenv = lambda *a, **kw: None
        sys.modules["dotenv"] = dotenv_mod

    if importlib.util.find_spec("aiogram") is None:
        aiogram_mod = types.ModuleType("aiogram")

        class _Expr:
            def __eq__(self, other):
                return self

            def startswith(self, prefix):
                return self

        class _F:
            text = _Expr()
            data = _Expr()

        class _Router:
            def message(self, *args, **kwargs):
                return lambda fn: fn

            def callback_query(self, *args, **kwargs):
                return lambda fn: fn

        class _Dispatcher:
            def __init__(self):
                self.update = MagicMock()

            def include_router(self, r):
                pass

            async def start_polling(self, bot):
                pass

        aiogram_mod.Bot = MagicMock
        aiogram_mod.Dispatcher = _Dispatcher
        aiogram_mod.Router = _Router
        aiogram_mod.F = _F()
        aiogram_mod.BaseMiddleware = object
        sys.modules["aiogram"] = aiogram_mod

        fsm_mod = types.ModuleType("aiogram.fsm")
        fsm_state_mod = types.ModuleType("aiogram.fsm.state")

        class _State:
            pass

        class _StatesGroupMeta(type):
            def __new__(mcs, name, bases, namespace):
                cls = super().__new__(mcs, name, bases, namespace)
                for k, v in namespace.items():
                    if isinstance(v, _State):
                        setattr(cls, k, f"{name}:{k}")
                return cls

        class _StatesGroup(metaclass=_StatesGroupMeta):
            pass

        fsm_state_mod.State = _State
        fsm_state_mod.StatesGroup = _StatesGroup
        fsm_ctx_mod = types.ModuleType("aiogram.fsm.context")
        fsm_ctx_mod.FSMContext = object
        sys.modules["aiogram.fsm"] = fsm_mod
        sys.modules["aiogram.fsm.state"] = fsm_state_mod
        sys.modules["aiogram.fsm.context"] = fsm_ctx_mod

        types_mod = types.ModuleType("aiogram.types")
        for cls_name in (
            "Message",
            "CallbackQuery",
            "ReplyKeyboardMarkup",
            "KeyboardButton",
            "ReplyKeyboardRemove",
            "InlineKeyboardMarkup",
            "InlineKeyboardButton",
            "TelegramObject",
        ):
            setattr(types_mod, cls_name, MagicMock)
        sys.modules["aiogram.types"] = types_mod

        filters_mod = types.ModuleType("aiogram.filters")
        filters_mod.Command = lambda *a, **kw: None
        sys.modules["aiogram.filters"] = filters_mod


_install_bot_dependency_stubs()
try:
    import bot  # noqa: E402
except ImportError:
    bot = None



def make_message(text=None):
    msg = MagicMock()
    msg.text = text
    msg.answer = AsyncMock()
    return msg


def make_state(initial_state=None, initial_data=None):
    current = {"state": initial_state, "data": dict(initial_data or {})}

    state = MagicMock()
    state.get_state = AsyncMock(side_effect=lambda: current["state"])
    state.set_state = AsyncMock(side_effect=lambda s: current.__setitem__("state", s))
    state.get_data = AsyncMock(side_effect=lambda: dict(current["data"]))
    state.update_data = AsyncMock(side_effect=lambda **kw: current["data"].update(kw))
    state.clear = AsyncMock(side_effect=lambda: (current.__setitem__("state", None), current["data"].clear()))
    return state, current


@unittest.skipIf(bot is None, "bot.py is not present (gitignored)")
class BotStateMachineTests(unittest.IsolatedAsyncioTestCase):
    async def test_non_text_and_empty_inputs_do_not_crash_fsm(self):
        for handler, active_state in [
            (bot.process_title, bot.CreateNotification.title),
            (bot.process_message, bot.CreateNotification.message),
            (bot.process_type, bot.CreateNotification.type),
            (bot.process_link, bot.CreateNotification.link),
            (bot.process_link_label, bot.CreateNotification.linkLabel),
        ]:
            state, current = make_state(active_state)
            msg_none = make_message(None)
            await handler(msg_none, state)
            self.assertEqual(current["state"], active_state)
            msg_none.answer.assert_awaited()

            msg_blank = make_message("   ")
            await handler(msg_blank, state)
            self.assertEqual(current["state"], active_state)
            msg_blank.answer.assert_awaited()

    async def test_list_clears_active_wizard_state(self):
        state, current = make_state(bot.CreateNotification.title, {"title": "draft"})
        msg = make_message("/list")

        orig_fetch = bot.fetch_notifications
        bot.fetch_notifications = lambda: ([], None)
        try:
            await bot.list_notifications(msg, state)
        finally:
            bot.fetch_notifications = orig_fetch

        self.assertIsNone(current["state"])
        self.assertEqual(current["data"], {})

    async def test_delete_callback_handles_ids_with_colons_and_serializes_gist_rmw(self):
        gist_store = [{"id": "notice:1:a"}, {"id": "notice:2:b"}, {"id": "notice:3:c"}]

        def fake_fetch():
            return list(gist_store), None

        def fake_update(updated):
            gist_store[:] = list(updated)
            return True, None

        orig_fetch = bot.fetch_notifications
        orig_update = bot.update_notifications
        bot.fetch_notifications = fake_fetch
        bot.update_notifications = fake_update
        try:
            cb1 = MagicMock()
            cb1.data = "del:notice:1:a"
            cb1.answer = AsyncMock()
            cb1.message = MagicMock()
            cb1.message.delete = AsyncMock()
            cb1.message.answer = AsyncMock()

            cb2 = MagicMock()
            cb2.data = "del:notice:3:c"
            cb2.answer = AsyncMock()
            cb2.message = MagicMock()
            cb2.message.delete = AsyncMock()
            cb2.message.answer = AsyncMock()

            await asyncio.gather(
                bot.process_callback_delete(cb1),
                bot.process_callback_delete(cb2),
            )
            self.assertEqual(gist_store, [{"id": "notice:2:b"}])
        finally:
            bot.fetch_notifications = orig_fetch
            bot.update_notifications = orig_update

    def test_build_notification_generates_unique_ids_within_same_second(self):
        ids = {
            bot.build_notification({"title": "T", "message": "M", "type": "info"})["id"]
            for _ in range(20)
        }
        self.assertEqual(len(ids), 20)


if __name__ == "__main__":
    unittest.main()
