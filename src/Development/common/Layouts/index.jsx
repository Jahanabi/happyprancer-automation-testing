import Header from "../../components/Header";

export const FormWrapper = ({ children, heading }) => {
  return (
    <div>
      <Header/>
      <div className='flex flex-col items-center justify-center h-[calc(100vh-8rem)]'>
        <div className={
          `bg-white flex flex-col max-w-4xl w-[25rem] items-center gap-1
          shadow-xl sm:px-20 px-4 py-8 sm-w-[480px] rounded-xl border`
        }>
          {heading && <h2 className='font-bold text-2xl'>{heading}</h2>}
          {children}
        </div>
      </div>
    </div>
  );
}