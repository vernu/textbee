import Link from 'next/link'
import React from 'react'

export default function CustomerSupportPage() {
  return (
    <div>
      <div>
        <Link
          href='/'
          style={{
            margin: '5px',
            padding: '5px',
          }}
        >{`<-- Go Back Home`}</Link>
      </div>
      <iframe
        src='https://docs.google.com/forms/d/e/1FAIpQLScdlaaW28BdL-J0DrfKbz5TY5JvaGbbc6IVp95cptOQlq4ElQ/viewform?embedded=true'
        width='100%'
        height='1015'
      >
        Loading…
      </iframe>
    </div>
  )
}
