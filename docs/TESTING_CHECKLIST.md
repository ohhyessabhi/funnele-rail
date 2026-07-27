# Rail PM — Aggressive Testing Checklist

## Auth & Permissions (CRITICAL)

- [ ] **First launch**: No users exist → "Add new account" appears and works
- [ ] **Add user with space in name**: "John Smith" → should not break initials or display
- [ ] **Add user with special characters**: "François" → should render correctly
- [ ] **Switch users mid-session**: Login as Abhi → add task → switch to Priya → task should NOT appear in "My Tasks"
- [ ] **Delete user who has tasks**: Tasks should orphan (assignee becomes null) but not delete
- [ ] **Admin sees all, team member sees nothing**: 
  - Abhi adds task assigned to Priya
  - Abhi logs in → task appears in "All Work"
  - Priya logs in → task appears in "My Tasks"
  - Priya logs out, Abhi logs in as different tab → isolation holds
- [ ] **Inbox access**: Non-admin can see inbox items (should they?). Test current behavior.
- [ ] **Add a task as non-admin to a client with no other access**: Assignee sees it, others don't

## Data Integrity

- [ ] **Rapid save**: Add 5 tasks in 2 seconds → all should persist
- [ ] **Concurrent edits (simulated)**: Open two browser tabs, edit same task in both → last write wins is documented
- [ ] **Delete task with comments**: Comments orphan silently (no error)
- [ ] **Delete client with tasks**: Tasks still exist but projectId points to missing project → "No client" shown
- [ ] **Empty title save**: Try to save task with empty title → should reject or default to "Untitled"
- [ ] **Very long task title** (300 chars): Should truncate gracefully in list, show full in drawer
- [ ] **Very long comment** (5000 chars): Should not break drawer layout, should wrap
- [ ] **Date edge cases**:
  - Due date = today → shows "today"
  - Due date = yesterday → shows "Xd ago" 
  - Due date = 30 days ago → should still show as overdue
  - Due date = far future (2099) → displays without error

## Navigation & Views

- [ ] **Sidebar as team member**: Admin section NOT visible
- [ ] **Sidebar as admin**: Admin section IS visible, all controls present
- [ ] **Project filter as team member**: Only projects with assigned tasks appear
- [ ] **Project filter as admin**: All active projects appear
- [ ] **View persistence**: Navigate to "My Tasks" → reload page → still on "My Tasks"
- [ ] **Invalid view parameter** (e.g., `view.type='nonexistent'`): Should fall back to "My Tasks"
- [ ] **Search clears when switching views**: Do it, then reopen palette

## Task Management

- [ ] **Create task without client**: Should assign to first client or reject clearly
- [ ] **Edit task client after creation**: Change from Client A to Client B → should appear in both filters
- [ ] **Status dropdown on row vs drawer**: Changing status in both places should stay in sync
- [ ] **Rapid status changes**: Change Backlog → Ready → In Progress in 3 clicks → all should stick
- [ ] **Move completed task back to Backlog**: Should un-close the row visually
- [ ] **Assign task to someone with no access**: Admin assigns to Priya, Priya sees it immediately
- [ ] **Unassigned task appears in team member view**: Should show "Unassigned" but not allow claiming (yet)

## Comments

- [ ] **Comment as non-owner**: Priya comments on Abhi's task → should appear with Priya's name
- [ ] **Empty comment submission**: Should reject, not create blank entry
- [ ] **Comment with markdown/HTML**: `**bold**` → should render as text, not formatted (safety)
- [ ] **Very old comment date**: Comment at 2000-01-01 → should not crash date formatting
- [ ] **Comment count accuracy**: Add 3, delete drawer, reopen → count should still be 3

## UI/UX Edge Cases

- [ ] **Mobile narrowing**: Sidebar disappears, drawer becomes full-width ✓ (CSS exists)
- [ ] **Drawer while login screen showing**: Should not stack incorrectly
- [ ] **Palette while drawer open**: Close drawer, then open palette → should work
- [ ] **Very small screen (320px)**: Should not wrap buttons awkwardly
- [ ] **Tab through UI**: Focus should move logically, not trap in hidden elements
- [ ] **Rapid palette input**: Type fast, results update without lag
- [ ] **Copy-paste long text into task title**: Should not overflow
- [ ] **Type in search while viewing client**: Results should still filter correctly

## Performance

- [ ] **100 tasks**: Add 100, load time should stay reasonable (<2s)
- [ ] **10 users**: Add 10 members, sidebar should not lag
- [ ] **Lots of comments**: Add 50 comments to one task → drawer still scrolls smoothly
- [ ] **Refresh with heavy data**: Reload page with 100 tasks → should load from storage without flicker

## Storage

- [ ] **Browser storage full**: What happens if storage quota exceeded? (Graceful error or silent fail?)
- [ ] **Clear browser data**: User clears storage → login screen appears, fresh state ✓
- [ ] **Logout and login different user**: Old user's data should not leak
- [ ] **Cross-tab sync** (if possible): Open 2 tabs, add task in tab 1 → should appear in tab 2 on refresh

## Bugs to Hunt

- [ ] **Status pills don't update on row after drawer edit**: Edit in drawer, close, row shows old status
- [ ] **Initials fail for single-word names**: "Prince" → "P" (correct) but is there a case that breaks?
- [ ] **Time format with 0 minutes**: Shows "0m" or blank? Should be consistent
- [ ] **Drawer scrolling**: If content is tall, does drawer body scroll or do you have to scroll page?
- [ ] **Palette flicker**: Opening/closing should not flash
- [ ] **Avatar background for unassigned**: Gray or accent? Should be obvious it's different
- [ ] **Ageing color on completed tasks**: Should ageing ever show color on done tasks? (Currently transparent spine)

## Permissions Bypass Attempts

- [ ] **Direct URL manipulation**: Can you change `view.type` in console to admin views as non-admin? (Should not matter, filtered in render)
- [ ] **Modify localStorage**: Change `currentUser` to admin ID → does it grant access? (No, role is checked at render time)
- [ ] **Edit drawer HTML to reveal admin controls**: E.g., unhide project dropdown → should not break, just cosmetic since saves don't happen server-side in prototype
