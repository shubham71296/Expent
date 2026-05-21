/** True while user verified OTP and still needs to set a new password (blocks auto-redirect to tabs). */
let active = false;

export const passwordResetFlow = {
  activate: () => {
    active = true;
  },
  deactivate: () => {
    active = false;
  },
  isActive: () => active,
};
