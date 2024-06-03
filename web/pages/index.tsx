import { Container } from '@chakra-ui/react'
import { useGoogleOneTapLogin } from '@react-oauth/google'

import { useDispatch, useSelector } from 'react-redux'
import FeaturesSection from '../components/landing/FeaturesSection'
import HowItWorksSection from '../components/landing/HowItWorksSection'
import IntroSection from '../components/landing/IntroSection'
import { loginWithGoogle, selectAuthUser } from '../store/authSlice'

import DownloadAppSection from '../components/landing/DownloadAppSection'
import CodeSnippetSection from '../components/landing/CodeSnippetSection'
import SupportTheProject from '../components/landing/SupportTheProject'
import Customization from '../components/landing/Customization'

export default function HomePage() {
  const authUser = useSelector(selectAuthUser)

  const dispatch = useDispatch()

  useGoogleOneTapLogin({
    onSuccess: ({ credential: idToken }) => {
      dispatch(
        // @ts-ignore
        loginWithGoogle({
          idToken,
        })
      )
    },
    onError: () => {},
    disabled: !!authUser,
  })

  return (
    <Container maxW={'7xl'}>
      <IntroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <DownloadAppSection />
      <Customization />
      <CodeSnippetSection />
      <SupportTheProject />
    </Container>
  )
}
