import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
// import NavBar from '../Components/NavBar'
import Footer from '../../../components/Footer'
import Context from '../../../Context/Context'
import InstitutionContext from '../../../Context/InstitutionContext'
import NavBar from '../../../components/Header'

const HybridClass = () => {
  const Navigate = useNavigate()
  const { isAuth } = useContext(Context)

  const InstitutionData = useContext(InstitutionContext)

  const handleButtonClick = () => {
    if (isAuth) {
      // If user is already authenticated, redirect to dashboard
      Navigate('/dashboard')
    } else {
      // If user is not authenticated, redirect to signup
      Navigate('/SignUp')
    }
  }

  return (
    <>
    <div className='flex'>
      <NavBar/>
    <div className="text-justify">
      <h1 className="text-center sans-serif mt-[6rem] text-[2.5rem] md:text-[3rem] lg:text-[3.75rem]">
        Hybrid Classes
      </h1>
      <div className="px-10 sm:px-4 md:px-16 ">
        <p className="mb-[2rem]">
          Welcome to <strong>HappyPrancer</strong>, your ultimate destination
          for the perfect fusion of fitness and fun! At{' '}
          <strong>HappyPrancer</strong>, we bring you exhilarating Zumba classes
          that combine energetic dance moves with heart-pounding music. Whether
          you're a beginner or an experienced dancer, our hybrid Zumba classes
          cater to all levels of expertise. Join our vibrant community and
          embark on a fitness journey that not only keeps you in shape but also
          leaves you grooving with joy!
        </p>

        <h1 className="text-[1.9rem] text-left mt-8 w-full sm:ml-0">
          Our Hybrid Zumba Classes
        </h1>

        <p className="mb-[2rem]">
          Experience the best of both worlds with our hybrid Zumba classes. We
          understand the importance of flexibility in your busy schedule, so we
          offer a mix of in-person and online classes. In our state-of-the-art
          studio, immerse yourself in the contagious energy of our live classes.
          Feel the rhythm, connect with our expert instructors, and dance your
          way to fitness. Can't make it to the studio? No worries! Join our
          virtual classes from the comfort of your home. With seamless streaming
          and interactive sessions, you'll never miss a beat. Our skilled
          instructors are dedicated to helping you master Zumba's diverse dance
          styles, from salsa and merengue to hip-hop and reggaeton.
        </p>

        <h1 className="text-[1.9rem] text-left mt-8 w-full sm:ml-0">
          Why Choose HappyPrancer?
        </h1>

        <p className="mb-[2rem]">
          What sets <strong>HappyPrancer</strong> apart is our unwavering
          commitment to your fitness goals. Our experienced Zumba instructors
          are passionate about teaching and will guide you through every step,
          ensuring you learn the moves correctly and have a blast while doing
          it. We prioritize your safety, which is why our in-person classes
          strictly adhere to health and safety protocols. Our virtual classes
          offer a secure environment where you can focus on your workout without
          any distractions. Plus, our hybrid approach gives you the freedom to
          choose the mode of learning that suits you best.
        </p>
        <div className="class-details text-[1.1rem] ">
          <strong>Class Details:</strong> Instructor Led Zumba
        </div>
        <div className="class-duration text-[1.1rem] ">
          <strong>Class Duration:</strong> 1 hour per session
        </div>
        <div className="instructor-name text-[1.1rem] ">
          <strong>Instructor:</strong> PK
        </div>
        <div className="address text-[1.1rem] mb-[2rem] text-left">
          <strong>Address:</strong> Ambassador of dance, Farmington hill,
          Michigan
        </div>
      </div>
      <div className="flex justify-center">
        <button
          className=" w-[15rem] text-white px-12 py-2 rounded-[8px] hover:text-lightPrimaryColor hover:bg-[hsl(178,28%,22%)] mb-4 h-[3rem] text-[1.2rem] tracking-[0.8px]"
          style={{
            backgroundColor: InstitutionData.LightPrimaryColor
          }}
          onClick={handleButtonClick}
        >
          Register Now
        </button>
      </div>
      <Footer />
    </div>
    </div>
    </>
  )
}

export default HybridClass
