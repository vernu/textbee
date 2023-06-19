import { Container } from '@chakra-ui/react'
import { useGoogleOneTapLogin } from '@react-oauth/google'

import { useDispatch, useSelector } from 'react-redux'
import FeaturesSection from '../components/home/FeaturesSection'
import HowItWorksSection from '../components/home/HowItWorksSection'
import IntroSection from '../components/home/IntroSection'
import { loginWithGoogle, selectAuth } from '../store/authReducer'

import DownloadAppSection from '../components/home/DownloadAppSection'
import CodeSnippetSection from '../components/home/CodeSnippetSection'

export default function HomePage() {
  const { user } = useSelector(selectAuth)

  const dispatch = useDispatch()

  useGoogleOneTapLogin({
    onSuccess: ({ credential: idToken }) => {
      dispatch(
        loginWithGoogle({
          idToken,
        })
      )
    },
    onError: () => {},
    disabled: !!user,
  })

  return (
    <Container maxW={'7xl'}>
      <IntroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <DownloadAppSection />
      <CodeSnippetSection />
    </Container>
  )
}
