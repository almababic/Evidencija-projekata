Specifikacije za projekat

“Evidencija projekata”


Uvod

Kreirati aplikaciju koja će pomoći IT (i drugim) kompanijama za evidentiranje procesa rada na projektima. Kompanije često rade više projekata, te na svakom projektu u pravilu radi više ljudi. Osim toga, jedna osoba često radi na više projekata. Samim tim, evidencija ukupnog uloženog rada na tim projektima je kompleksan proces koji često uzima značajan dio vremena, a ispravno vođenje evidencije olakšava proces naplaćivanja usluge. Stoga, potrebno je kreirati aplikaciju koja će olakšati evidenciju rada na projektima.

Ovaj sistem će omogućiti efikasno praćenje utrošenih radnih sati, napretka projekata i upravljanje resursima. Uloge u sistemu su:

Administrator Sistema

●	Administratori su osnovna kontrolna tačka u sistemu.
●	Mogu dodavati nove projekte u sistem i dodeljivati zaposlenima.
●	Prate sve aktivnosti u sistemu putem administratorskog panela.
●	Imaju mogućnost dodavanja novih korisnika u sistem, uređivanja njihovih podataka i brisanja korisničkih računa. Pri kreiranju zaposlenih, omogućiti dodavanje i hijerarhije zaposlenih (nadređeni).

Menadžeri Projekata

●	Menadžeri projekata su zaposlenici/radnici odgovorni za upravljanje pojedinim projektima.
●	Mogu kreirati nove projekte sa detaljima kao što su naziv, opis, startni i završni datum.
●	Dodeljuju druge radnike projektima i prate napredak projekta.
●	Imaju uvid u utrošene radne sate na projektima.
●	Imaju uvid u sve taskove koji postoje na projektu.
●	Imaju uvid u status taskova, kao i niz izvještaja (broj urađenih taskova, koji taskovi kasne, koji su urađeni na vrijeme i drugo).
●	Mogu voditi više projekata.

Radnici

●	Radnici su registrovani korisnici sistema. Radnici rade na projektima, ali istovremeno, mogu i voditi projekat (tj. nekada radnik i menadžer projekta može biti ista osoba).
●	Imaju pristup projektima na kojima rade i mogu unositi informacije o utrošenim radnim satima na tom projektu.
●	Unose podatke na osnovu taskova, dakle, pri unosu podataka, moraju izabrati klijenta, projekat i task.
●	Komuniciraju sa svojim nadređenima i kolegama putem sistema, razmjenjujući informacije i postavljajući pitanja.
●	Imaju mogućnost jednostavnog i brzog unosa podataka putem tekstualnog unosa, npr. Dovoljno je unijeti #projekat ##task t5, te će to unijeti 5 sati na task “task” u projekat “projekat”. Osmisliti u skladu sa vašom implementacijom najbolji način za unos i parsiranje.


Glavne funkcionalnosti sistema


1.	Upravljanje Projektima:
a.	Kreiranje novih projekata sa detaljima kao što su naziv, opis, startni i završni datum.
b.	Kreiranje taskova za projekte.
c.	Dodeljivanje radnika tim projektima i kreiranje timova.
d.	Praćenje napretka projekata i njihovih statusa.

2.	Evidencija Radnih Sati:
a.	Unos i praćenje utrošenih radnih sati na projektima za svakog zaposlenog.
b.	Generisanje izvještaja o radnim satima po projektima i zaposlenima.

3.	Komunikacija:
a.	Interna komunikacija putem sistema između zaposlenih, menadžera i administratora.
b.	Mogućnost slanja poruka, obaveštenja i obaveštenja o projektima.
c.	Dobijanje notifikacija na e-mail.

4.	Prisustvo i Radno Vreme:
a.	Mogućnost praćenja prisustva zaposlenih i registrovanje radnog vremena.
b.	Generisanje izvještaja o prisustvu i radnom vremenu.

Pri radu je dozvoljeno koristiti MongoDB ili PostgreSQL. Za backend se koristi Node.js, dok se za frontend koristi EJS.
