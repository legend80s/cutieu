const formatTime = (date, { dateOnly = false, dateSeparator = '/' } = {}) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  const dateString = [year, month, day].map(formatNumber).join(dateSeparator);

  if (dateOnly) {
    return dateString;
  }

  return dateString + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

module.exports = {
  formatTime: formatTime
}
