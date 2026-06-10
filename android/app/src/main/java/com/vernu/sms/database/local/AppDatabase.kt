package com.vernu.sms.database.local

/*
import android.content.Context
import androidx.room.*

@Database(entities = [Sms::class], version = 2)
@TypeConverters(DateConverter::class)
abstract class AppDatabase : RoomDatabase() {

    abstract fun localReceivedSMSDao(): SmsDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "db1"
                ).build().also { INSTANCE = it }
            }
        }
    }
}
*/
