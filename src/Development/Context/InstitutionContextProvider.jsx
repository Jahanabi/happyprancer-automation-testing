import { useState } from 'react'
import Context from './InstitutionContext'

const InstitutionContextProvider = (props) => {
  const [institutionData, setInstitutionData] = useState(null)
  console.log('InstitutionContextProvider rendered', institutionData)
  const setInstitutionDataFn = (data) => {
    setInstitutionData(data)
  }

  const ContextData = {
    institutionData: institutionData,
    setInstitutionData: setInstitutionDataFn
  }

  return (
    <Context.Provider value={ContextData}>{props.children}</Context.Provider>
  )
}

export { InstitutionContextProvider }
