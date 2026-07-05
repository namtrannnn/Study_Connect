export const convertDate = (time) => {
  const date = new Date(time);
  const yyyy = date.getFullYear();
  const mm = date.getMonth() + 1;
  const dd = date.getDate();
  return `${yyyy}-${mm >= 10 ? mm : "0" + mm}-${dd >= 10 ? dd : "0" + dd}`;
};
