---
description: 
globs: 
alwaysApply: true
---

### React Native
You are an expert in TypeScript, React Native, Expo, and Mobile App Development.

Code Style and Structure:
- Write concise, type-safe TypeScript code.
- Use functional components and hooks over class components. Use arrow functions to create the components and add proper typings wherever needed
- Ensure components are modular, reusable, and maintainable.
- Organize files by feature, grouping related components, hooks, and styles.
- Destructure objects as much as possible
- The following is not applicable if using tailwind: Always split the component code from styles. Styles should always go in a separate file. For example if you are creating a profile screen, make a folder `profile-screen` and in there make two files, `profile-screen/index.tsx` and `profile-screen/styles.ts`
- The directory structure of react native projects should always have the following
  - `src` should contain all ract native related files.
  - `src/components` this directory contains all the components that can be reused in the project. Whenever you are asked to create a new component or implement a new design, this is the directory where you should create the respective folder along with files. for example
  ```
    components/button // contents of button component
    ├── button.tsx // contains all the component logic
    └── button.test.tsx // contains all the component tests
  ```
  - The component should be declared as an exported arrow function. for example
  ```ts
    // All the imports and other stuff
    type Props {
        // all props
    }
    // ...
    export const MyButton: FC<PropsWithChildren<Props>> = ({
      // ... destructure props
    }) => {
      // All the copmenent level logic
      // ...
      return (
        // UI elements go here
      )
    }
    // ...
  ```
  - `src/app` should contain all the pages and layouts. read the docs for further explaination https://docs.expo.dev/develop/file-based-routing/
  - `src/services` this directory contains of all the helping material inside a project. an example of this is given as following
    ```
      services
      ├── apis // contains apis of the whole app
      │   ├── axios-client.ts
      │   └── index.ts
      ├── constants // contains constants and strings used in the app
      │   └── index.ts
      └── types // contains all the types of the app which are reuseable. however types which are used in a signle component reside in its own directory types.ts file
          ├── api-types.ts
          └── form-types.ts
    ```

Implementing the apis:
  - Apis reside in a file called `src/services/apis`. Whenever implementing a new api, add it in the apis object first. An example of apis file is given as following
  ``` js
    // ...
    export const apis = {
      // ...
      authenticateWithFirebaseToken: ({ idToken }: ApiTypes.Authenticate) => axiosClient.post<ApiTypes.AuthResponse>("auth/authenticate", { idToken }),
      // ...
    };
    // ...
  ```

  And wherever you have to use it, call it from apis object like this

  ``` js
    const { data } = await apis.authenticate({ idToken });
  ```

Implementing the screens:
- Just like components, whenever you are asked to implement a screen, make a folder in the `src/screens`. It contains component file and test files always and `types` and `_layout.tsx` only when they are required. for example, search page might look like this
```
    src/screens/search // contents of search page
    ├── search.tsx // contains all the screen logic
    ├── _layout.tsx // contains screen layout (optional)
    └── search.test.ts // contains test
```
- In the `search.tsx` file, name of the screen should be declared properly for example for search screen, name shoule be `Search`.
- The screen component should be declared as an exported arrow function.
```ts
  // All the imports and other stuff
  // ...
  export const Search: FC<PropsWithChildren> = () => {
    // All the copmenent level logic
    // ...
    return (
      // Screen elements go here
    )
  }
  // ...
```
- Often times, a screen may contain components which are already declared in the codebase. Before jumping to implementation, check in the `components` folder if there is something you might use. for example buttons, input fields, cards, modals etc may be found in the `components` fodler.
- Whenever there are input fields in the screen, make sure to use keyboard avoiding scroll views to allow the screen to adjust according to the keyboard visibility
- Always use react-hook-form and zod for data inputs and validations

Naming Conventions:
- Use camelCase for variable and function names (e.g., `onClick`, `handleSubmit`).
- Use PascalCase for component names in react and react native (e.g., `UserProfile`, `ChatScreen`).
- Directory names should be lowercase and hyphenated (e.g., `user-profile`, `chat-screen`).
- Avoid using ambiguous names for variables or components

TypeScript Usage:
- Use TypeScript for all components, favoring types for props and state.
- Enable strict typing in `tsconfig.json`.
- Avoid using `any`; strive for precise types.
- Utilize `React.FC` for defining functional components with props.

UI and Styling:
- Use consistent styling.
- Ensure responsive design by considering different screen sizes and orientations.
- Do not use inline styling. Always use tailwind

Best Practices:
- Follow React Native's threading model to ensure smooth UI performance.
- Utilize Expo's EAS Build and Updates for continuous deployment and Over-The-Air (OTA) updates.
- Use React Navigation for handling navigation and deep linking with best practices