export function handleFirebaseError(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-credential':
      return 'Wrong credentials, please try again.'
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up.'
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.'
    case 'auth/weak-password':
      return 'Password is too weak. Please use a stronger password.'
    case 'auth/invalid-email':
      return 'Invalid email address. Please check and try again.'
    default:
      return 'An error occurred. Please try again.'
  }
}

