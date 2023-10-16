import type { AppProps } from 'next/app'
import { Provider } from 'react-redux'
import { store } from '../store/store'
import { Box, ChakraProvider } from '@chakra-ui/react'
import Navbar from '../components/Navbar'
import Meta from '../components/meta/Meta'
import { GoogleOAuthProvider } from '@react-oauth/google'
import ErrorBoundary from '../components/ErrorBoundary'
import Footer from '../components/Footer'
import Analytics from '../components/analytics/Analytics'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <Analytics />
        <GoogleOAuthProvider
          clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
        >
          <ChakraProvider>
            <Meta />
            <Navbar />
            <Wrapper>
              <Component {...pageProps} />
            </Wrapper>
            <Footer />
          </ChakraProvider>
        </GoogleOAuthProvider>
      </Provider>
    </ErrorBoundary>
  )
}

const Wrapper = ({ children }) => {
  return <Box minH='75vh'>{children}</Box>
}

export default MyApp
