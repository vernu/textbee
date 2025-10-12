"use client"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Github, Heart, MessageSquare, Linkedin, Twitter, Share2, LinkIcon } from 'lucide-react'
import Link from 'next/link'
import { ExternalLinks } from '@/config/external-links'
import { useState } from 'react'
import { toast } from '@/hooks/use-toast'
import Image from 'next/image'
import { DialogHeader, DialogTitle, Dialog, DialogContent } from '@/components/ui/dialog'

export default function CommunityLinks() {
   const [socialOpen, setSocialOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState("");
  const [index, setIndex] = useState(0);
  const icons = [
    "/images/facebook.svg",
    "/images/x.svg",
    "/images/linkedin2.svg",
    "/images/reddit.svg",
    "/images/pinterest.svg",
    "/images/whatsapp.svg",
    "/images/telegram.svg",
    "/images/gmail.svg",
  ];

  const socialLinks = [
    "https://www.facebook.com/sharer/sharer.php?u=https://textbee.dev",
    "https://twitter.com/intent/tweet?url=https://textbee.dev&text=Check%20out%20TextBee!%20",
    "https://www.linkedin.com/sharing/share-offsite/?url=https://textbee.dev",
    "https://www.reddit.com/submit?url=https://textbee.dev&title=Check%20out%20TextBee!%20",
    "https://pinterest.com/pin/create/button/?url=https://textbee.dev&description=Check%20out%20TextBee!%20&media=https://textbee.dev/og-image.png",
    "https://api.whatsapp.com/send?text=Check%20out%20TextBee!%20%20https://textbee.dev",
    "https://t.me/share/url?url=https://textbee.dev&text=Check%20out%20TextBee!%20",
    "mailto:?subject=Check%20out%20TextBee!%20&body=Here’s%20the%20link:%20https://textbee.dev",
  ];

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedUrl(content);

    toast({
      title: "Link copied!",
      description: "The Link has been copied to your clipboard.",
    });
    setTimeout(() => setCopiedUrl(""), 3000);
  };

  return (
    <>
    
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-2'>
      {/* <Card>
        <CardHeader>
          <CardTitle>One-time Donation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground mb-4'>
            Support us with a one-time donation of your desired amount.
          </p>
          <Link href={ExternalLinks.polar} prefetch={false} target='_blank'>
            <Button className='w-full' variant='destructive'>
              <Heart className='mr-2 h-4 w-4' />
              Donate Once
            </Button>
          </Link>
        </CardContent>
      </Card> */}

      {/* <Card>
        <CardHeader>
          <CardTitle>Support on Patreon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground mb-4'>
            Support the development by becoming a patron.
          </p>
          <Link href={ExternalLinks.patreon} prefetch={false} target='_blank'>
            <Button className='w-full' variant='secondary'>
              <Heart className='mr-2 h-4 w-4' />
              Become a Patron
            </Button>
          </Link>
        </CardContent>
      </Card> */}

      <Card>
        <CardHeader>
          <CardTitle>GitHub</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground mb-4'>
            Check out our source code and contribute to the project.
          </p>
          <Link href={ExternalLinks.github} prefetch={false} target='_blank'>
            <Button className='w-full'>
              <Github className='mr-2 h-4 w-4' />
              View Source
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Discord</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground mb-4'>
            Join our community for support and updates.
          </p>
          <Link href={ExternalLinks.discord} prefetch={false} target='_blank'>
            <Button className='w-full' variant='outline'>
              <MessageSquare className='mr-2 h-4 w-4' />
              Join Discord
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>X (Twitter)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground mb-4'>
            Follow us on X for the latest updates and announcements.
          </p>
          <Link href={ExternalLinks.twitter} prefetch={false} target='_blank'>
            <Button className='w-full' variant='outline'>
              <Twitter className='mr-2 h-4 w-4' />
              Follow on X
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>LinkedIn</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground mb-4'>
            Connect with us on LinkedIn for updates and news.
          </p>
          <Link href={ExternalLinks.linkedin} prefetch={false} target='_blank'>
            <Button className='w-full' variant='outline'>
              <Linkedin className='mr-2 h-4 w-4' />
              Connect on LinkedIn
            </Button>
          </Link>
        </CardContent>
      </Card>
       <Card>
          <CardHeader>
            <CardTitle> Share to social media</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Share textbee.dev via social medias
            </p>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setSocialOpen(true)}
            >
              <Share2 className="mr-2 h-4 w-4" /> Share to social media
            </Button>
          </CardContent>
        </Card>

    </div>
      <Dialog open={socialOpen} onOpenChange={setSocialOpen}>
        <DialogContent className="sm:max-w-[500px] text-base">
          <DialogHeader>
            <DialogTitle className="text-primary mb-3 text-xl">
              Social Share
            </DialogTitle>
          </DialogHeader>
          <p className="text-md">Share this link via</p>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between bg-white rounded-md p-2 items-center">
              {icons.map((icon, ind) => (
                <button
                  key={icon}
                  type="button"
                  title={icon}
                  onClick={() => setIndex(ind)}
                  className={`${
                    index === ind
                      ? "border-primary border-2"
                      : "border-gray-400"
                  } p-1 rounded-md border`}
                >
                  <Image src={icon} alt="icon" width={24} height={24} />
                </button>
              ))}
            </div>
            <p className="text-md">Copy Link</p>
            <div className="flex items-center gap-2 border-2 rounded-md p-2 border-gray-500 w-full">
              <LinkIcon className="w-7 h-7 flex-shrink-0 text-blue-600 dark:text-blue-400 font-bold" />{" "}
              <Link
                href={socialLinks[index]}
                className="text-blue-500 dark:text-blue-400 break-all"
                target="_blank"
              >
                {socialLinks[index]}
              </Link>
            </div>
            <Button onClick={() => copyToClipboard(socialLinks[index])}>
              Copy
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </>
  )
}
