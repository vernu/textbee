import { Container } from '@chakra-ui/react'
import { useGoogleOneTapLogin } from '@react-oauth/google'
import Router from 'next/router'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import FeaturesSection from '../components/home/FeaturesSection'
import HowItWorksSection from '../components/home/HowItWorksSection'
import IntroSection from '../components/home/IntroSection'
import { loginWithGoogle, selectAuth } from '../store/authReducer'

export default function HomePage() {
  const { accessToken, user } = useSelector(selectAuth)
  useEffect(() => {
    if (accessToken && user) {
      Router.push('/dashboard')
    }
  }, [accessToken, user])

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
  })

  return (
    <Container maxW={'7xl'}>
      <IntroSection />
      <FeaturesSection />
      <HowItWorksSection />
    </Container>
  )
}
