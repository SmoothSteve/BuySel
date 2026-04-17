export interface Seller {
  id: number
  email: string
  role?: 'buyer' | 'seller' | 'conveyancer' | 'admin' | 'user'
  firstname: string
  lastname: string
  mobile: string
  address: string
  idbloburl: string
  idverified: string | null
  dte: string
  termsconditions: boolean
  privacypolicy: boolean
  middlename?: string
  dateofbirth: string | null
  residencystatus: string
  maritalstatus: string
  powerofattorney?: string
  idtype: string
  ratesnotice: string | null
  ratesnoticeverified: string | null
  titlesearch: string | null
  titlesearchverified: string | null
  admin: boolean
  photoazurebloburl: string | null
  photoverified: string | null
}
