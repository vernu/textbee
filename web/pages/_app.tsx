import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { Provider } from 'react-redux'
import { store } from '../store/store'
import { ChakraProvider } from '@chakra-ui/react'
import Navbar from '../components/Navbar'
import Meta from '../components/meta/Meta'
import { GoogleOAuthProvider } from '@react-oauth/google'
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID }>
        <ChakraProvider>
          <Meta />
          <Navbar />
          <Wrapper>
            <Component {...pageProps} />
          </Wrapper>
        </ChakraProvider>
      </GoogleOAuthProvider>
    </Provider>
  )
}

const Wrapper = ({ children }) => {
  return <>{children}</>
}

export default MyApp
