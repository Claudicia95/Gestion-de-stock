import React from 'react'
import NavBar from './NavBar'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'  

type WrapperProps = {
  children: React.ReactNode
}

const Wrapper = ({ children }: WrapperProps) => {
  return (
    <div className='px-5 md:px-[10%] mt-8 mb-10'>
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <NavBar />
      {children}
    </div>
  )
}

export default Wrapper