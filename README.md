# whovotedthis - Simple Anonymous Voting System

Simply create a Qoom account, `npm run build`, upload it, and enjoy!

Check it out live [here](https://icyfiremen86.qoom.space/~/build).

## Features

- Landing page
- Login/logout/signup user-based features
- Poll voting, three separate mode: **Open**, **Voting**, and **Closed**
- Poll option limiting
- **Anonymity**
- Responsive, thanks to Material UI
- *Out of the box!*

## Motivation

This project is used as a demonstration in the [PeddieHacks](https://peddiehacks.peddie.org/) hackathon 2021.

## What I use

React (bootstrapped with Create React App), Material UI, and other awesome libraries, including my utility [ConfigPool](src/utils/ConfigPool.tsx), which is a wrapper of MobX that internally binds to React class components.

## Notes

**Only administrators can create polls**, so make sure you have at least one account with administrator priveleges in the account database of your Qoom project.

You can signup one by copying the code below and run it in your Qoom space.

```js
const username = 'YOUR_USERNAME';
const password = 'YOUR_PASSWORD';
const type = 'admin'; // for admin user or 'user' for normal user
const data = { username, password, type };

await fetch('/~/YOUR_PROJECT_NAME/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
});
```

Also before building the project, make sure to modify `homepage` in `package.json` to point correctly to your Qoom space. A Qoom project file `project.json` will be automatically generated for you, so simply change the name of the `build` folder if you want a different project name, then upload.
