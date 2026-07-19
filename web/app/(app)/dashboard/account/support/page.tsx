import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import SupportForm from '../../(components)/account/support-form'

export default function SupportPage() {
  return (
    <div className='max-w-2xl'>
      <Card>
        <CardHeader>
          <CardTitle>Contact Support</CardTitle>
          <CardDescription>
            Fill out the form below and we'll get back to you as soon as
            possible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SupportForm />
        </CardContent>
      </Card>
    </div>
  )
}
