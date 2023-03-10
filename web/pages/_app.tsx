import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { Provider } from 'react-redux'
import { store } from '../store/store'
import { ChakraProvider } from '@chakra-ui/react'
import Navbar from '../components/Navbar'
import Meta from '../components/meta/Meta'
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <ChakraProvider>
        <Meta />
        <Navbar />
        <Wrapper>
          <Component {...pageProps} />
        </Wrapper>
      </ChakraProvider>
    </Provider>
  )
}

const Wrapper = ({ children }) => {
  return <>{children}</>
}

export default MyApp
