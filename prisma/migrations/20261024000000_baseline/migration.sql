
[+] Added tables
  - board
  - board_members
  - card_members
  - cards
  - lists
  - user
  - workspace
  - workspace_member

[*] Changed the `board` table
  [+] Added foreign key on columns (workspace_id)

[*] Changed the `board_members` table
  [+] Added foreign key on columns (board_id)
  [+] Added foreign key on columns (user_id)

[*] Changed the `card_members` table
  [+] Added foreign key on columns (card_id)
  [+] Added foreign key on columns (user_id)

[*] Changed the `cards` table
  [+] Added foreign key on columns (created_by)
  [+] Added foreign key on columns (list_id)

[*] Changed the `lists` table
  [+] Added foreign key on columns (board_id)

[*] Changed the `workspace_member` table
  [+] Added foreign key on columns (user_id)
  [+] Added foreign key on columns (workspace_id)
