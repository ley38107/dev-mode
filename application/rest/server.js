// 📦 백엔드 (Express + MySQL + SDK 포함)
// server.js

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const sdk = require('./sdk');
const app = express();
const port = 8001;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB 연결 설정
const db = mysql.createConnection({
   host: 'localhost',
   user: 'webuser',
   password: 'yourpassword',
   database: 'walletdb'
});

db.connect((err) => {
   if (err) {
      console.error('❌ DB 연결 오류:', err);
   } else {
      console.log('✅ MySQL 연결 성공');

      // ✅ users 테이블 생성 (없을 경우)
      const createTableQuery = `
       CREATE TABLE IF NOT EXISTS users (
         id INT AUTO_INCREMENT PRIMARY KEY,
         wallet_address VARCHAR(100) NOT NULL UNIQUE,
         tickets INT DEFAULT 0,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
       )
     `;

      db.query(createTableQuery, (err) => {
         if (err) {
            console.error('❌ users 테이블 생성 오류:', err);
         } else {
            console.log('✅ users 테이블 확인 완료 (존재하거나 새로 생성됨)');
         }
      });
   }
});


// 지갑 주소 등록 or 확인 + 초기 뽑기권 1장 지급
app.post('/addUser', async (req, res) => {
   const { userID } = req.body;
   console.log(`🪪 addUser 요청: ${userID}`);

   const checkQuery = 'SELECT * FROM users WHERE wallet_address = ?';
   const insertQuery = 'INSERT INTO users (wallet_address, tickets) VALUES (?, ?)';

   db.query(checkQuery, [userID], async (err, result) => {
      if (err) {
         console.error('❌ DB 조회 오류:', err);
         return res.status(500).json({ success: false, message: 'DB 조회 오류' });
      }

      if (result.length > 0) {
         return res.json({ success: true, existing: true });
      } else {
         db.query(insertQuery, [userID, 1], async (err) => {
            if (err) {
               console.error('❌ DB 삽입 오류:', err);
               return res.status(500).json({ success: false, message: 'DB 삽입 오류' });
            }

            try {
               console.log('🚀 체인코드 InitUser 호출 중...');
               await sdk.send(false, 'InitUser', [userID, '100'], res);
            } catch (e) {
               console.error('❌ 체인코드 InitUser 호출 실패:', e);
               return res.status(500).json({ success: false, message: '체인코드 오류', error: e.message });
            }
         });
      }
   });
});

// 🎟️ 뽑기권 사용 요청
app.post('/useTicket', (req, res) => {
   const { userID } = req.body;
   if (!userID) return res.status(400).json({ success: false, message: '지갑 주소 없음' });

   const checkQuery = 'SELECT tickets FROM users WHERE wallet_address = ?';
   const updateQuery = 'UPDATE users SET tickets = tickets - 1 WHERE wallet_address = ?';

   db.query(checkQuery, [userID], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'DB 조회 오류' });
      if (result.length === 0) return res.status(404).json({ success: false, message: '사용자 없음' });
      if (result[0].tickets <= 0) return res.status(400).json({ success: false, message: '보유 뽑기권 없음' });

      db.query(updateQuery, [userID], (err) => {
         if (err) return res.status(500).json({ success: false, message: '티켓 차감 실패' });
         return res.json({ success: true, message: '뽑기권 1장 사용 완료' });
      });
   });
});

// 뽑기권 증가 요청
app.post('/plusTicket', (req, res) => {
   const { userID } = req.body;
   if (!userID) return res.status(400).json({ success: false, message: '지갑 주소 없음' });

   const checkQuery = 'SELECT tickets FROM users WHERE wallet_address = ?';
   const updateQuery = 'UPDATE users SET tickets = tickets + 1 WHERE wallet_address = ?';

   db.query(checkQuery, [userID], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'DB 조회 오류' });
      if (result.length === 0) return res.status(404).json({ success: false, message: '사용자 없음' });

      db.query(updateQuery, [userID], (err) => {
         if (err) return res.status(500).json({ success: false, message: '티켓 증가 실패' });
         return res.json({ success: true, message: '뽑기권 1장 증가 완료' });
      });
   });
});


app.use(express.static(path.join(__dirname, '../client')));

app.listen(port, HOST, () => {
   console.log(`🚀 서버 실행 중: http://${HOST}:${port}`);
});
