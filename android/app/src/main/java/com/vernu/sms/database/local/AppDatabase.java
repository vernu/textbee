//package com.vernu.sms.database.local;
//
//import android.content.Context;
//import androidx.room.Database;
//import androidx.room.Room;
//import androidx.room.RoomDatabase;
//
//@Database(entities = {SMS.class}, version = 2)
//public abstract class AppDatabase extends RoomDatabase {
//    private static volatile AppDatabase INSTANCE;
//
//    public static AppDatabase getInstance(Context context) {
//        if (INSTANCE == null) {
//            synchronized (AppDatabase.class) {
//                if (INSTANCE == null) {
//                    INSTANCE = Room.databaseBuilder(context.getApplicationContext(), AppDatabase.class, "db1")
//                            .build();
//                }
//            }
//        }
//        return INSTANCE;
//    }
//
//    public abstract SMSDao localReceivedSMSDao();
//}