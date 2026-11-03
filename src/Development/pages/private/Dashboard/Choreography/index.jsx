import { useContext } from 'react'
import InstitutionContext from '../../../../Context/InstitutionContext'

const Choreography = () => {
  const InstitutionData = useContext(InstitutionContext).institutionData

  return (
    <div className={`w-[100%] flex flex-col justify-center items-center pt-6`}>
      <iframe
        src={InstitutionData.YTLink}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className={`w-[76vw] h-[calc(100vh-150px)] max1050:w-[86vw] max1050:h-[47vw]`}
      ></iframe>
    </div>
  )
}

export default Choreography