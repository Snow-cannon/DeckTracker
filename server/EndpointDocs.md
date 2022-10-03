# ApiRoute Endpoints

This documents the methods, bodies, and responses for the server endpoints.
***

## PUT /users/signup

**Purpose**: Creates an empty account with the specified email and password and sets an authentication cookie for the user, logging them in to the new account.

**Body**:

```json
{
    "email": "[any string]",
    "password": "[any string]"
}
```

**Response Body**: N/A

**Response Status**:

- Status 201:
  - Success
  - No response body
- Status 400:
  - Email or Password is missing
- Status 409:
  - Email already in use
- Status 500:
  - Internal error

***

## POST /users/login

**Purpose**: Creates an authentication cookie for the user, logging them into their associated account.

**Body**:

```json
{
    "email": "[any string]",
    "password": "[any string]"
}
```

**Response Body**: N/A

**Response Status**:

- Status 202:
  - Success
  - No response body
- Status 400:
  - Email or Password is missing
- Status 401:
  - Email not found OR Password was not valid
- Status 500:
  - Internal error

***

## GET /users/data

**Purpose**: Returns the email in the users authentication cookie.

**Body**:

```json
{
    "password": "[any string]"
}
```

**Response Body**:

```json
{
    "email": "[users email address]"
}
```

**Response Status**:

- Status 200:
  - Success
  - Response body is sent
- Status 400:
  - Password is missing
- Status 401:
  - Password was not valid
- Status 500:
  - Internal error

***

## DELETE /users/data

**Purpose**: Deletes a user and their associated data from the database.

**Body**:

```json
{
    "password": "[any string]"
}
```

**Response Body**: N/A

**Response Status**:

- Status 200:
  - Success
  - No response body
- Status 400:
  - Password is missing
- Status 401:
  - Password was not valid
- Status 500:
  - Internal error

***

## PUT /users/decks

**Purpose**: Creates a deck with the specified cards, entered in MTGO format. Can accept an empty string and add create an empty decklist.

**Body**:

```json
{
    "deckname": "[any string]"
}
```

**Response Body**:

```json
{
    "deckid": "[id for created deck]",
    "unprocessed": [
        "[any card name]",
        [...]
    ]
}
```

**Response Status**:

- Status 201:
  - Success
  - Response body is sent
- Status 400:
  - deckname missing/invalid
- Status 401:
  - No authorization
- Status 422:
  - Cards could not be processed
- Status 500:
  - Internal error

***

## DELETE /users/decks

**Purpose**: Deletes a deck and its associated content from the database.

**Body**:

```json
{
    "deckid": "[any deckid]"
}
```

**Response Body**: N/A

**Response Status**:

- Status 200:
  - Success
  - No response body
- Status 400:
  - deckid missing/invalid
- Status 401:
  - No authorization
- Status 500:
  - Internal error

***

## GET /users/decks

**Purpose**: Returns the deck names and ids for all the users associated decks.

**Body**: N/A

**Response Body**:

```json
{
    "decks": [
        {
            "deckname": "[any deck name]",
            "deckid": "[any deck id]"
        }
        ...
    ]
}
```

**Response Status**:

- Status 200:
  - Success
  - No response body
- Status 401:
  - No authorization
- Status 500:
  - Internal error

***

## POST /users/decks/content

**Purpose**: Returns the content from a specific deck

**Body**:

```json
{
    "deckid": "[any deckid]"
}
```

**Response Body**:

```json
{
    "contents": [
        {
            "cardname": "[any card name]",
            "img": "[stringified array of img uris]",
            "setname": "[any set name]",
            "colors": "[combo of chars from 'WUBRG']",
            "identity": "[combo of chars from 'WUBRG']",
            "cmc": "[0 ~ inf]",
            "rarity": "[Name of any rarity]",
            "bulk": "[Stringified JSON data]"
        },
        "..."
    ]
}
```

**Response Status**:

- Status 202:
  - Success
  - Response body is sent
- Status 400:
  - deckid missing/invalid
- Status 401:
  - No authorization
- Status 500:
  - Internal error

***

## GET /users/collection

**Purpose**: Returns the card collection of the user.

**Body**: N/A

**Response Body**:

```json
{
    "collection": [
        {
            "cardname": "[any card name]",
            "has": "[0 ~ inf]"
        },
        "..."
    ]
}
```

**Response Status**:

- Status 200:
  - Success
  - Response body is sent
- Status 401:
  - No authorization
- Status 500:
  - Internal error

***

## PATCH /users/collection

**Purpose**: Sets the amount of a certain card a user has in their collection.

**Body**:

```json
{
    "cardname": "[any card name]",
    "totalamount": "[0 ~ inf]"
}
```

**Response Body**: N/A

**Response Status**:

- Status 201:
  - Success
  - No response body
- Status 400:
  - cardname or totalamount is invalid or missing
- Status 401:
  - No authorization
- Status 500:
  - Internal error
