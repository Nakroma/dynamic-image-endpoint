## Dynamic Image Endpoint

Small [Express](https://github.com/expressjs/express) endpoint to serve static images with dynamic sizes.
Simply plug the provided handler function into an Express app endpoint and you're good to go.

### Installation
```bash
yarn add dynamic-image-endpoint
# OR
npm install dynamic-image-endpoint
```

### Usage
```js
import express from 'express';
import handler from 'dynamic-image-endpoint';

const app = express();
app.get('*', handler('path/to/images'));
app.listen(3000);
```
Now `localhost:3000/image.jpg` will serve `path/to/images/image.jpg`.
You can additionally specify a width through the query parameters,
e.g. `localhost:3000/image.jpg?width=200` will serve `path/to/images/image.jpg` resized to 200px width,
the height will be calculated automatically. The resulting image will be saved on disk.

### Development
```bash
# Setup
yarn

# Build project
yarn build

# Test project
yarn test
```
