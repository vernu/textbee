import { Container } from '@chakra-ui/react'
import Router from 'next/router'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import FeaturesSection from '../components/home/FeaturesSection'
import IntroSection from '../components/home/IntroSection'
import { selectAuth } from '../store/authSlice'

export default function HomePage() {
  const { accessToken, user } = useSelector(selectAuth)
  useEffect(() => {
    if (accessToken && user) {
      Router.push('/dashboard')
    }
  }, [accessToken, user])

  return (
    <Container maxW={'7xl'}>
      <IntroSection />
      <FeaturesSection />
    </Container>
  )
}
