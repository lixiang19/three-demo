function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}
function getRandomElementsFromArray(arr, proportion) {
  // 确保比例是在0到1之间
  if (proportion < 0) proportion = 0;
  if (proportion > 1) proportion = 1;

  // 计算要返回的元素数量
  const count = Math.round(arr.length * proportion);

  // 创建一个数组副本，以便随机选择元素时不修改原数组
  const arrCopy = [...arr];

  // 随机选择元素
  const selectedElements = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * arrCopy.length);
    selectedElements.push(arrCopy.splice(randomIndex, 1)[0]);
  }

  return selectedElements;
}
export { randomBetween, getRandomElementsFromArray };