# Guide d'utilisation : Tester l'application avec Expo Go

Ce guide vous explique étape par étape comment exécuter et tester l'application **Workout Buddy** directement sur votre téléphone intelligent (cellulaire) à l'aide d'**Expo Go**.

## Prérequis

1. Votre ordinateur (où le code s'exécute) et votre téléphone cellulaire doivent être connectés **au même réseau Wi-Fi**.
2. Node.js et npm doivent être installés sur votre ordinateur (ce qui est déjà le cas si vous avez généré le projet).

---

## Étape 1 : Installer Expo Go sur votre cellulaire

L'application **Expo Go** agit comme une "coquille" qui va télécharger temporairement votre code via le Wi-Fi pour l'afficher sur votre écran comme une vraie application.

- **Si vous avez un iPhone (iOS)** : Ouvrez l'**App Store**, cherchez `Expo Go` et installez l'application.
- **Si vous avez un téléphone Android** : Ouvrez le **Google Play Store**, cherchez `Expo Go` et installez l'application.

---

## Étape 2 : Démarrer le serveur sur l'ordinateur

Dans le terminal de votre ordinateur, naviguez jusqu'au dossier du projet (si ce n'est pas déjà fait) :
```bash
cd /home/jfg-desktop/code/musculation/workout_buddy
```

Ensuite, lancez la commande suivante pour démarrer le serveur local :
```bash
npx expo start
```

*Note : Lors du démarrage, il est normal de voir le texte "Starting Metro Bundler". Si une erreur liée à "React Native DevTools" et "chrome-sandbox" s'affiche (surtout sous Linux), vous pouvez l'ignorer en toute sécurité. Cela n'affecte pas l'application.*

Après quelques secondes, un grand **code QR** va s'afficher dans votre terminal.

---

## Étape 3 : Scanner le code QR avec votre téléphone

1. **Sur iPhone (iOS)** : 
   - Ouvrez simplement l'application **Appareil photo** de base de votre iPhone.
   - Pointez-la vers le code QR sur l'écran de votre ordinateur.
   - Une petite notification jaune "Ouvrir dans Expo Go" apparaîtra à l'écran. Cliquez dessus.

2. **Sur Android** :
   - Ouvrez l'application **Expo Go** que vous venez d'installer.
   - Appuyez sur **"Scan QR code"** (Scanner un code QR).
   - Pointez la caméra vers le code QR sur l'écran de votre ordinateur.

---

## Étape 4 : Utiliser l'application

- Après avoir scanné le code, vous verrez un écran de chargement (le téléphone télécharge le code depuis votre ordinateur via le Wi-Fi).
- L'application **Workout Buddy** va s'afficher sur votre téléphone ! 
- Chaque fois que vous ferez une modification dans le code sur votre ordinateur et que vous sauvegarderez le fichier, l'application sur votre téléphone se mettra à jour **automatiquement et instantanément** (Hot Reload).

---

## Dépannage (Troubleshooting)

- **Le chargement bloque à 0% ou échoue (Network response timed out) :**
  - Cela signifie que votre téléphone n'arrive pas à communiquer avec votre ordinateur via le réseau Wi-Fi local (parfois à cause du pare-feu, d'un réseau public, ou d'un VPN).
  - **Solution :** Stoppez le serveur dans votre terminal (avec `Ctrl + C`). Redémarrez le serveur en forçant un tunnel avec la commande :
    ```bash
    npx expo start --tunnel
    ```
  - Un nouveau code QR apparaîtra, scannez ce nouveau code. Le transfert se fera par internet (légèrement plus lent au chargement) et contournera les problèmes de réseau local.

- **L'application crash avec l'erreur DevTools sous Linux :**
  - Comme mentionné à l'étape 2, cette erreur est liée au débogueur (DevTools) et non à votre application. Le code QR reste parfaitement valide !
