const testItem = document.getElementById("textDisplay");
const inputItem = document.getElementById("textInput");
const timeName = document.getElementById("timeName");
const time = document.getElementById("time");
const cwName = document.getElementById("cwName");
const cw = document.getElementById("cw");
const restartBtn = document.getElementById("restartBtn");
const thirty = document.getElementById("thirty");
const sixty = document.getElementById("sixty");
const beg = document.getElementById("beg");
const pro = document.getElementById("pro");

var wordNo = 1;
var wordsSubmitted = 0;
var wordsCorrect = 0;
var timer = 30;
var flag=0;
var factor=2;
var seconds;
var difficulty=1;

displayTest(difficulty);

//on Input
inputItem.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    event.preventDefault(); // чтобы не добавлялся перевод строки
    checkWord();
  }
});

inputItem.addEventListener('input', function(event){
  if(flag===0){
    flag=1;
    timeStart();
  }
  var charEntered = event.data;
  if(/\s/g.test(charEntered)){  //check if the character entered is a whitespace
    checkWord();
  }
  else{
    currentWord();
  }
});

//time selection
thirty.addEventListener("click",function(){
  timer = 30;
  factor = 2;
  limitColor(thirty,sixty);
  time.innerText = timer;
});
sixty.addEventListener("click",function(){
  timer = 60;
  factor = 1;
  limitColor(sixty, thirty);
  time.innerText = timer;
});

//difficulty Selection
beg.addEventListener("click",function(){
  difficulty = 1;
  displayTest(difficulty);
  limitColor(beg,pro);
});
pro.addEventListener("click",function(){
  difficulty = 2;
  displayTest(difficulty);
  limitColor(pro,beg);
});

//set the color of time and difficulty
function limitColor(itema,itemr ){
  // Визуально выделяем активный селектор
  itema.classList.add('active');
  itema.setAttribute('aria-pressed','true');

  itemr.classList.remove('active');
  itemr.setAttribute('aria-pressed','false');
}

//restart the Test
restartBtn.addEventListener("click",function(){

  wordsSubmitted = 0;
  wordsCorrect = 0;
  flag=0;

  time.classList.remove("current");
  cw.classList.remove("current");
  time.innerText = timer;
  timeName.innerText = "Time";
  cw.innerText = wordsCorrect;
  cwName.innerText = "CW";
  inputItem.disabled = false;
  inputItem.value = '';
  inputItem.focus();

  displayTest(difficulty);
  clearInterval(seconds);
  limitVisible();
});

//start the timer countdown
function timeStart(){
  limitInvisible();
  seconds = setInterval(function() {
    time.innerText--;
    if (time.innerText == "-1") {
        timeOver();
        clearInterval(seconds);
    }
  }, 1000);
}

//set Limit visibility
function limitVisible(){
  thirty.style.visibility = 'visible';
  sixty.style.visibility = 'visible';
  beg.style.visibility = 'visible';
  pro.style.visibility = 'visible';
}
function limitInvisible(){
  thirty.style.visibility = 'hidden';
  sixty.style.visibility = 'hidden';
  beg.style.visibility = 'hidden';
  pro.style.visibility = 'hidden';
}

//display the score
function displayScore(){
  let percentageAcc = 0;
  if(wordsSubmitted!==0){
    percentageAcc = Math.floor((wordsCorrect/wordsSubmitted)*100);
  }

  time.classList.add("current");
  cw.classList.add("current");

  time.innerText = percentageAcc+"%";
  timeName.innerText = "PA";

  cw.innerText = factor*wordsCorrect;
  cwName.innerText = "WPM";
}

//check if the user is entering correcrt word
function currentWord(){
  const wordEntered = inputItem.value;
  const currentID = "word "+wordNo;
  const currentSpan = document.getElementById(currentID);
  const curSpanWord = currentSpan.innerText;

  if(wordEntered == curSpanWord.substring(0,wordEntered.length)){
    colorSpan(currentID, 2);
  }
  else{
    colorSpan(currentID, 3);
  }

}
//checks word entered
function checkWord(){
  const wordEntered = inputItem.value;
  inputItem.value='';

  const wordID = "word "+wordNo;
  const checkSpan = document.getElementById(wordID);
  wordNo++;
  wordsSubmitted++;
  console.log(wordEntered.trim() + " vs " + checkSpan.innerText.trim());
  if(checkSpan.innerText.trim() === wordEntered.trim()){
    colorSpan(wordID, 1);
    wordsCorrect++;
    cw.innerText=wordsCorrect;
  }
  else{
    colorSpan(wordID, 3);
  }

  if(wordNo>40){

    displayTest(difficulty);
  }
  else{
    const nextID = "word "+wordNo;
    colorSpan(nextID, 2);
  }
}

//color the words
function colorSpan(id, color){
  const span = document.getElementById(id);
  if(color === 1 ){
    span.classList.remove('wrong');
    span.classList.remove('current');
    span.classList.add('correct');
  }
  else if(color ===2){
    span.classList.remove('correct');
    span.classList.remove('wrong');
    span.classList.add('current');
  }
  else{
    span.classList.remove('correct');
    span.classList.remove('current');
    span.classList.add('wrong');
  }
}

//display the random words on screen
function displayTest(diff){
  wordNo = 1;
  testItem.innerHTML = '';

  let newTest = randomWords(diff);
  newTest.forEach(function(word, i){
    let wordSpan = document.createElement('span');
    wordSpan.innerText = word;
    wordSpan.setAttribute("id", "word " + (i+1));
    testItem.appendChild(wordSpan);
  });

  const nextID = "word "+wordNo;
  colorSpan(nextID, 2);
}

//Generate an array of random 50 words
function randomWords(diff){

var topWords = [
  "превосходительство","благоразумие","здравоохранение","достопримечательность","соответствующий",
  "предпринимательство","ответственность","непреодолимый","противоречивый","электрификация",
  "демилитаризация","неудовлетворительный","конституционность","взаимозаменяемость","инфраструктура",
  "интеллектуальный","исключительность","совершенствование","непредсказуемость","чрезвычайный",
  "конкурентоспособность","взаимодействие","многообразие","неправомерный","обстоятельство",
  "предрасположенность","представительство","машиностроение","сельскохозяйственный","восстановление",
  "автоматизация","экспериментальный","высококвалифицированный","неотвратимость","электронный",
  "дезинформация","компетентность","непогрешимость","противодействие","многофункциональный",
  "беспрецедентный","непрерывность","взаимоисключающий","искусствоведение","многозадачность",
  "квалификация","преобразование","переосмысление","параллелепипед","индивидуальность",
  "распространённость","соискатели","правоохранительный","высокоэффективный","неприемлемый",
  "правомерность","сопоставимость","взаимосвязанный","добросовестность","противозаконный",
  "рационализатор","метаморфоза","импортозамещение","электроэнергетика","сверхпроводимость",
  "космополитизм","фундаментальность","неподконтрольный","многоступенчатый","многоугольник",
  "непричастность","бессистемность","международный","первоисточник","гуманитарный",
  "совместительство","приоритетность","деятельность","согласованность","внутренний",
  "исповедальность","неприкасаемый","противоестественный","бесконечность","противоударный",
  "сверхъестественный","безотлагательный","несоизмеримый","сельскохозяйство","неподготовленный",
  "непредусмотренный","диспропорция","гиперответственность","сверхаккуратный","персонализированный",
  "переоборудование","высокотехнологичный","шестидесятичетырёхбитный","многонациональный",
  "психоэмоциональный","электромагнитный","социокультурный","парообразование",
  "предположительный","неосуществимый","безвозмездный","миропонимание","неинформированность",
  "всеобъемлющий","неопровержимый","добровольческий","жизнеобеспечение","великодушие",
  "высокомерие","неподражаемый","небезызвестный","неоднозначность","переоценивание",
  "преступность","опосредованность","сверхважный","конфиденциальность","противоречие",
  "совместимость","невообразимый","многоуровневый","переустановка","миросозерцание",
  "противоречивость","сверхскоростной","безошибочность","межведомственный","импровизация",
  "переизбыток","злоупотребление","многословность","неодушевлённый","сверхмощный",
  "переукомплектование","взаимовыручка","сверхважность","непримиримость","старомодность",
  "переоснащение","многоцелевой","сверхзащищённый","неосмотрительность","превосходство",
  "сверхплотность","объективность","съёмка","подъезд","разъярённый","объём","предъявление",
  "въедливый","объект","изъян","трёхмерный","вьюга","пьеса","всёохватывающий","предубеждение",
  "расшифровка","сверхъяркий","синхронизация","переориентация","противоизносный","осуществимость",
  "переоценка","распознавание","непреложный","преимущество","преобладание","злоумышленник",
  "целеустремлённость","взаимозависимость","несовместимый","противодействующий","многократность",
  "совершеннолетие","вдохновляющий","рентабельность","непосредственность","неподтверждённый",
  "многофакторный","артериосклероз","термоэлектрический","кровообращение","миротворчество"
];

var basicWords = [
  "я","ты","он","она","мы","вы","они","да","нет","и","а","но","что","как","где","когда","почему","зачем","кто",
  "это","там","тут","всё","не","быть","есть","мой","твой","его","её","наш","ваш","их",
  "человек","дом","кот","собака","мяч","стол","стул","книга","ручка","окно","дверь","город","мир","улица",
  "друг","семья","мама","папа","сын","дочь","брат","сестра","школа","работа","учёба","вода","чай","кофе",
  "еда","хлеб","соль","сахар","молоко","сыр","мясо","рыба","суп","яблоко","банан","сок",
  "день","ночь","утро","вечер","сегодня","вчера","завтра","час","минута","год","месяц","неделя",
  "раз","два","три","четыре","пять","шесть","семь","восемь","девять","десять",
  "маленький","большой","длинный","короткий","высокий","низкий","широкий","узкий",
  "хороший","плохой","новый","старый","чистый","грязный","тёплый","холодный","сильный","слабый",
  "быстрый","медленный","лёгкий","тяжёлый","добрый","злой","весёлый","грустный","тихий","громкий",
  "близко","далеко","вверх","вниз","лево","право","вперёд","назад","рядом","внутри","снаружи",
  "идти","бежать","ехать","лететь","плыть","стоять","сидеть","лежать","вставать","падать",
  "брать","давать","нести","держать","открывать","закрывать","ждать","смотреть","видеть","слышать",
  "говорить","слушать","читать","писать","думать","знать","понимать","помнить","спрашивать","отвечать",
  "любить","хотеть","мочь","нужно","делать","играть","учить","учиться","помогать","работать","жить",
  "покупать","продавать","платить","бесплатно","дорого","дешево","магазин","рынок","деньги","цена",
  "машина","поезд","автобус","трамвай","метро","самолёт","такси","станция","дорога","путь",
  "лес","поле","гора","река","море","озеро","небо","солнце","луна","звезда","ветер","дождь","снег",
  "огонь","дым","пепел","камень","песок","земля","трава","цветок","дерево","лист",
  "тело","рука","нога","голова","лицо","глаз","нос","рот","ухо","волосы","палец","колено","спина",
  "домой","вместе","один","двое","трое","много","мало","ещё","ужe","всегда","иногда","часто","редко",
  "сейчас","потом","раньше","сначала","позже","быстро","медленно","сильно","слабо","точно","примерно",
  "правда","ложь","давай","пожалуйста","спасибо","извини","простите","привет","пока",
  "вверх","вниз","сюда","туда","отсюда","оттуда","надо","можно","нельзя",
  "квартира","комната","кухня","ванна","коридор","балкон","пол","потолок","стена","лампа","свет",
  "телефон","компьютер","часы","телевизор","радио","клавиатура","мышь","экран","звук","кнопка",
  "бумага","тетрадь","карандаш","линейка","ластик","сумка","портфель","папка",
  "одежда","куртка","пальто","рубашка","футболка","брюки","платье","юбка","носки","ботинки","кроссовки",
  "шапка","шарф","перчатки","зонт",
  "север","юг","восток","запад","Россия","мирный","место","время","путь","сила","мысль","идея",
  "право","лево","центр","край","часть","целое","начало","конец",
  "ранний","поздний","утренний","вечерний","дневной","ночной",
  "сосед","учитель","ученик","врач","пациент","повар","водитель","продавец","покупатель",
  "игра","фильм","музыка","песня","книга","история","картина","фото","новость","газета","журнал",
  "сайт","страница","письмо","сообщение","вопрос","ответ","задача","пример","правило",
  "страх","радость","горе","надежда","мечта","цель","план","правда","вера","любовь","дружба"
];

  if(diff==1){
    wordArray = basicWords;
  }
  else{
    wordArray =topWords;
  }

  var selectedWords = [];
  for(var i=0;i<40;i++){
    var randomNumber = Math.floor(Math.random()*wordArray.length);
    selectedWords.push(wordArray[randomNumber]+" ");
  }
  return selectedWords;
}

// === Сохранение статистики попыток в localStorage ===

// Получение массива попыток
function getTypingStats() {
  const key = 'typingStats';
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Ошибка чтения статистики:', e);
    return [];
  }
}

// Сохранение одной попытки
function saveAttempt(attempt) {
  const key = 'typingStats';
  const stats = getTypingStats();
  stats.push(attempt);
  try {
    localStorage.setItem(key, JSON.stringify(stats));
  } catch (e) {
    console.error('Ошибка записи статистики:', e);
  }
}

// Помощники для сохранения текущей попытки
function currentDifficultyLabel() {
  return difficulty === 1 ? 'beginner' : 'pro';
}


function timeOver(){
  inputItem.disabled = true;
  restartBtn.focus();

  displayScore();
  const percentageAcc = (wordsSubmitted !== 0) ? Math.floor((wordsCorrect / wordsSubmitted) * 100) : 0;
  const attempt = {
    date: new Date().toISOString(),
    durationSec: timer,
    difficulty: currentDifficultyLabel(),
    wpm: factor * wordsCorrect, 
    accuracyPercent: percentageAcc,
    wordsCorrect,
    wordsSubmitted
  };
  saveAttempt(attempt);
}

