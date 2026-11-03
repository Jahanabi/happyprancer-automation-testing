import {EmailInput, PrimaryButton} from "../../../common/Inputs";

const EmailForm = ({ handler }) => {
  return (
    <form
      onSubmit={handler}
      className={
        `flex flex-col items-center gap-6
        w-full`
      }
    >
      <p className="text-center text-gray-600 mb-2">Don't stress it. We'll help you reset.</p>
      <div className="w-full text-left">
        <label
          htmlFor="forgot-email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email Address
        </label>
        <EmailInput id="forgot-email" name="email" className="rounded w-full" />
      </div>
      <PrimaryButton>Send OTP</PrimaryButton>
    </form>
  )
}

export default EmailForm;