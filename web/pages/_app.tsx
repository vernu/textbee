import type { AppProps } from 'next/app'
import { Provider } from 'react-redux'
import { store } from '../store/store'
import { Box, Button, ChakraProvider } from '@chakra-ui/react'
import Meta from '../components/meta/Meta'
import { GoogleOAuthProvider } from '@react-oauth/google'
import ErrorBoundary from '../components/ErrorBoundary'
import Footer from '../components/Footer'
import Analytics from '../components/analytics/Analytics'
import dynamic from 'next/dynamic'
import LiveChat from '../components/livechat/LiveChat'

function MyApp({ Component, pageProps }: AppProps) {
  const NoSSRNavbar = dynamic(() => import('../components/Navbar'), {
    ssr: false,
  })

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <Analytics />
        <LiveChat />
        <GoogleOAuthProvider
          clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
        >
          <ChakraProvider>
            <Meta />
            <NoSSRNavbar />
            <Wrapper>
              <Component {...pageProps} />
            </Wrapper>

            <div>
              <a href='/customer-support'>
                <Button
                  style={{
                    position: 'fixed',
                    bottom: 1,
                    right: 1,
                    height: '80px',
                    borderRadius: '100%',
                    border: '1px solid red',
                    color: 'red',
                  }}
                >
                  Customer <br />
                  Support
                </Button>
              </a>
            </div>
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
