import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ContactsController } from './contacts.controller'
import { ContactsService } from './contacts.service'
import { ContactSpreadsheet, ContactSpreadsheetSchema } from './schemas/contact-spreadsheet.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ContactSpreadsheet.name, schema: ContactSpreadsheetSchema },
    ]),
  ],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule {}