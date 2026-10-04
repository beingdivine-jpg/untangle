import type { TaskId } from "../plan/content";
// Questions check the specific limitation taught by the corresponding authored guide.
export const lessons: Record<TaskId, { en: string; pl: string; yes: boolean }> =
  {
    recovery: {
      en: "Can Google still offer your previous recovery details for a short time after a change?",
      pl: "Czy Google może jeszcze przez pewien czas proponować poprzednie dane odzyskiwania po ich zmianie?",
      yes: true,
    },
    devices: {
      en: "Does a device name prove which person used the account?",
      pl: "Czy nazwa urządzenia dowodzi, która osoba korzystała z konta?",
      yes: false,
    },
    password: {
      en: "Does changing a password also check your location sharing and saved photo copies?",
      pl: "Czy zmiana hasła sprawdza również udostępnianie lokalizacji i zapisane kopie zdjęć?",
      yes: false,
    },
    forwarding: {
      en: "Does switching off forwarding recall emails already sent elsewhere?",
      pl: "Czy wyłączenie przekazywania cofa wiadomości już wysłane gdzie indziej?",
      yes: false,
    },
    maps: {
      en: "Does checking Google Maps also check location sharing in every other app?",
      pl: "Czy sprawdzenie Map Google sprawdza też udostępnianie lokalizacji we wszystkich innych aplikacjach?",
      yes: false,
    },
    apple: {
      en: "Does reviewing sharing tell you whether someone already saved a copy of your information?",
      pl: "Czy sprawdzenie udostępniania mówi Ci, czy ktoś wcześniej zapisał kopię Twoich danych?",
      yes: false,
    },
    keep: {
      en: "Is it worth deciding what to keep before you delete messages or change sharing?",
      pl: "Czy warto zdecydować, co zachować, zanim usuniesz wiadomości lub zmienisz udostępnianie?",
      yes: true,
    },
    photos: {
      en: "Does stopping partner sharing remove photos the other person already saved?",
      pl: "Czy zakończenie udostępniania partnerowi usuwa zdjęcia, które druga osoba już zapisała?",
      yes: false,
    },
    whatsapp: {
      en: "Does unlinking a device remove copies of messages someone already saved?",
      pl: "Czy odłączenie urządzenia usuwa kopie wiadomości, które ktoś już zapisał?",
      yes: false,
    },
    family: {
      en: "Could leaving a family group affect shared subscriptions or storage?",
      pl: "Czy opuszczenie grupy rodzinnej może wpłynąć na współdzielone subskrypcje lub miejsce na dane?",
      yes: true,
    },
    home: {
      en: "Does changing one account password review access to every shared home device?",
      pl: "Czy zmiana hasła do jednego konta sprawdza dostęp do wszystkich wspólnych urządzeń domowych?",
      yes: false,
    },
    images: {
      en: "Do you need to upload a private image to Untangle to find help?",
      pl: "Czy trzeba przesłać prywatne zdjęcie do Untangle, aby znaleźć pomoc?",
      yes: false,
    },
    support: {
      en: "Do you need a perfect explanation before you ask someone for help?",
      pl: "Czy musisz dokładnie wyjaśnić całą sytuację, zanim poprosisz kogoś o pomoc?",
      yes: false,
    },
  };
