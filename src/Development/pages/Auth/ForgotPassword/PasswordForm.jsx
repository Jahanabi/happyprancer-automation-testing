import {OtpInput, PasswordInput, PrimaryButton} from "../../../common/Inputs";

const PasswordForm = ({ handler }) => {
  return (
    <form
      onSubmit={handler}
      className={
        `flex flex-col items-center gap-6
        w-full`
      }
    >
      <div className="w-full text-left">
        <label
          htmlFor="reset-password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          New Password
        </label>
        <PasswordInput
          id="reset-password"
          name="password"
          className="rounded w-full"
        />
      </div>

      <div className="w-full text-left">
        <label
          htmlFor="reset-password-confirm"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Confirm Password
        </label>
        <PasswordInput
          id="reset-password-confirm"
          name="password_confirmation"
          className="rounded w-full"
          placeholder="Confirm Password"
        />
      </div>

      <div className="w-full text-left">
        <label
          htmlFor="reset-otp"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          OTP Code
        </label>
        <OtpInput id="reset-otp" name="otp" className="w-full rounded" />
      </div>

      <PrimaryButton>Change Password</PrimaryButton>
    </form>
  )
}

export default PasswordForm;