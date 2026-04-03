
const fs = require('fs');
const filePath = 'e:/DBMS/frontend/app/globals.css';
let content = fs.readFileSync(filePath, 'utf8');

const regexSlideRise = /@keyframes ppt-slide-rise\s*\{[\s\S]*?100%\s*\{[^}]*\}\s*\}/;
const regexItemRise = /@keyframes ppt-item-rise\s*\{[\s\S]*?to\s*\{[^}]*\}\s*\}/;

const newSlideRise = \
  @keyframes ppt-slide-rise {
    0% {
      opacity: 0;
      transform: scale(0.85) translate(80px, 80px) perspective(1200px) rotateX(15deg) rotateY(-10deg);
      filter: blur(16px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translate(0, 0) perspective(1200px) rotateX(0deg) rotateY(0deg);
      filter: blur(0px);
      scroll-behavior: auto;
    }
  }\;

const newItemRise = \
  @keyframes ppt-item-rise {
    from {
      opacity: 0;
      transform: scale(0.85) translate(40px, 40px);
      filter: blur(8px);
    }
    to {
      opacity: 1;
      transform: scale(1) translate(0, 0);
      filter: blur(0px);
    }
  }\;

content = content.replace(regexSlideRise, newSlideRise);
content = content.replace(regexItemRise, newItemRise);

fs.writeFileSync(filePath, content, 'utf8');
console.log('CSS keyframes updated!');

