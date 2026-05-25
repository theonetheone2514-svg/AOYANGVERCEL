export function getIsanGreeting(): { header: string; sub: string } {
  const h = new Date().getHours()

  if (h >= 5 && h < 12) {
    return {
      header: '☀️ สวัสดีตอนเช้าเด้อ',
      sub: 'สะแตกหยังดีสู สั่งโลดบ่ต้องเกรงใจ',
    }
  }
  if (h >= 12 && h < 17) {
    return {
      header: '🌤️ สวัสดีตอนบ่ายเด้อ',
      sub: 'เที่ยงแล้วหาหยังกะแทกปากดี ส้มแข่ว',
    }
  }
  if (h >= 17 && h < 22) {
    return {
      header: '🌅 สวัสดีตอนเย็นเด้อ',
      sub: 'ยามแลงนั่งแยงผุสาว เอาจักเมนูบ่หล่ะ',
    }
  }
  return {
    header: '🌙 สวัสดีตอนดึกเด้อ',
    sub: 'ดีกแล้วสิเฮดหยังกะเฮดเด้อ',
  }
}
