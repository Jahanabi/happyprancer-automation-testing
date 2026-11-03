import { createContext } from 'react'

const InstitutionContext = createContext({
  institutionData: {},
  setInstitutionData: () => {}
})

export default InstitutionContext
