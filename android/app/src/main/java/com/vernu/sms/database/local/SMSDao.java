//package com.vernu.sms.database.local;
//
//import androidx.room.Dao;
//import androidx.room.Delete;
//import androidx.room.Insert;
//import androidx.room.OnConflictStrategy;
//import androidx.room.Query;
//
//import java.util.List;
//
//@Dao
//public interface SMSDao {
//
//    @Query("SELECT * FROM sms")
//    List<SMS> getAll();
//
//    @Query("SELECT * FROM sms WHERE id IN (:smsIds)")
//    List<SMS> loadAllByIds(int[] smsIds);
//
//    @Insert(onConflict = OnConflictStrategy.REPLACE)
//    void insertAll(SMS... sms);
//
//
//    @Delete
//    void delete(SMS sms);
//
//}