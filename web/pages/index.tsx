import { Box, Container } from '@chakra-ui/react'
import { useGoogleOneTapLogin } from '@react-oauth/google'
import Image from 'next/image'
import Router from 'next/router'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import FeaturesSection from '../components/home/FeaturesSection'
import HowItWorksSection from '../components/home/HowItWorksSection'
import IntroSection from '../components/home/IntroSection'
import { loginWithGoogle, selectAuth } from '../store/authReducer'

const Wave = ({ rotate }: { rotate?: boolean }) => (
  <Box transform={rotate ? 'rotate(180deg)' : ''}>
    <img src={'/images/wave.svg'} alt={'wave'} />
  </Box>
)

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
    disabled: !!user,
  })

  return (
    <Container maxW={'7xl'}>
      <IntroSection />
      <Wave rotate />
      <FeaturesSection />
      <Wave />
      <HowItWorksSection />
      <Wave />
    </Container>
  )
}
