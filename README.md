# Gvantca Bachilava — Portfolio

Site de présentation : anthropologie et ethnologie, Université Côte d’Azur.
Mémoire de recherche, enquêtes de terrain et dossiers à feuilleter page à page.

## Structure

```
index.html          la page
style.css           la mise en forme
script.js           les animations et la liseuse PDF
assets/img/         les photographies (extraites des dossiers)
documents/          les PDF lus par la liseuse
```

## Voir le site sur son ordinateur

La liseuse a besoin d’un petit serveur (ouvert par double-clic, le navigateur bloque la lecture des PDF) :

```
cd portfolio-gvantca
python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000

## Mettre en ligne avec GitHub Pages

1. Créer un dépôt public et y envoyer le contenu de ce dossier.
2. Sur GitHub : Settings → Pages → Source « Deploy from a branch » → branche `main`, dossier `/ (root)`.
3. Le site sera disponible à l’adresse indiquée par GitHub après une à deux minutes.

## Coordonnées et formulaire

Tout se règle en haut de `script.js`, dans le bloc `CONTACT` :

```js
const CONTACT = {
  email: ['gvantca.bachilava', 'gmail.com'],   // découpé en deux pour échapper aux robots
  phone: '07 53 43 02 07',
  linkedin: 'https://www.linkedin.com/in/gvantcabachilava',
  formKey: '',                                 // clé Web3Forms, à coller ici
};
```

Une valeur laissée vide (`''`) masque la ligne correspondante sur la carte de visite.

### Relier le formulaire à la boîte mail (Web3Forms, gratuit)

1. Aller sur https://web3forms.com et saisir l’adresse Gmail de Gvantca.
2. Une clé (« Access Key ») arrive par e-mail : la coller dans `formKey`, puis publier.
3. Se connecter sur https://app.web3forms.com avec la même adresse, ouvrir le formulaire et choisir **hCaptcha** comme protection anti-spam (« Block Spam »). Sans cette étape, le captcha est vérifié par le site mais pas par Web3Forms.
4. Envoyer un message de test depuis le site en ligne.

Les messages arrivent directement dans la boîte mail. Le bouton « Répondre » répond au visiteur.
La clé peut rester visible dans le code : elle ne permet d’écrire qu’à cette adresse.
Tant que `formKey` est vide, le formulaire ouvre la messagerie du visiteur avec le message prêt.

### Protections contre le spam

1. Contrôle des champs : nom en lettres, e-mail valide et non jetable, message de 20 à 3000 caractères, deux liens au maximum, pas de code HTML.
2. Deux champs pièges invisibles : un robot qui les remplit croit avoir envoyé son message, mais rien ne part.
3. Délai minimal : un formulaire rempli en moins de 2,5 secondes est ignoré.
4. Filtre de mots typiques des spams (casino, crypto, viagra…).
5. Limites par navigateur : un message par minute, trois par 24 heures, pas deux fois le même.
6. Case hCaptcha « Je suis humain », obligatoire avant l’envoi.
7. Filtre anti-spam de Web3Forms côté serveur.

## Ajouter un document

1. Déposer le PDF dans `documents/` (nom sans espaces ni accents).
2. L’ajouter dans la liste `DOCS` en haut de `script.js`.
3. Ajouter un bouton `data-open="identifiant"` dans `index.html` (option : `data-page="12"` pour ouvrir à une page précise).

## Crédits

Lecture des PDF : [PDF.js](https://mozilla.github.io/pdf.js/) (Mozilla, licence Apache 2.0), chargé depuis jsDelivr.
Polices : Bodoni Moda, Cormorant Garamond, Jost et Noto Serif Georgian (Google Fonts).
