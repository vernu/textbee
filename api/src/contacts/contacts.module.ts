import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ContactsController } from './contacts.controller'
import { ContactsService } from './contacts.service'
import { ContactSpreadsheet, ContactSpreadsheetSchema } from './schemas/contact-spreadsheet.schema'
import { Contact, ContactSchema } from './schemas/contact.schema'
import { ContactTemplate, ContactTemplateSchema } from './schemas/contact-template.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ContactSpreadsheet.name, schema: ContactSpreadsheetSchema },
      { name: Contact.name, schema: ContactSchema },
      { name: ContactTemplate.name, schema: ContactTemplateSchema },
    ]),
  ],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule {}