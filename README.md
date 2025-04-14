# Subly - Subscription Manager

Subly helps you track and manage your subscriptions automatically by scanning your emails and detecting recurring payments. Take control of your subscription expenses in one place.

## Features

- **Email Scanning**: Automatically detect subscriptions from Gmail
- **Manual Entry**: Add subscriptions manually
- **Dashboard**: View all your subscriptions in one place
- **Cost Analysis**: See your total monthly and yearly spend
- **Renewal Alerts**: Get notified before your subscriptions renew

## Tech Stack

- Next.js 15
- React 19
- Tailwind CSS
- Supabase (Authentication & Database)
- Gmail API

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Google Cloud project with Gmail API enabled

### Supabase Setup

1. Create a new Supabase project
2. Create a `subscriptions` table with the following schema:

```sql
create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users,
  service_name text not null,
  amount numeric not null,
  billing_cycle text not null,
  next_due_date date not null,
  created_at timestamp with time zone default now(),
  logo_url text,
  category text,
  description text,
  auto_detected boolean default false
);

-- Enable Row Level Security
alter table subscriptions enable row level security;

-- Create a policy that allows users to see only their own subscriptions
create policy "Users can view their own subscriptions"
  on subscriptions for select
  using (auth.uid() = user_id);

-- Create a policy that allows users to insert their own subscriptions
create policy "Users can insert their own subscriptions"
  on subscriptions for insert
  with check (auth.uid() = user_id);

-- Create a policy that allows users to update their own subscriptions
create policy "Users can update their own subscriptions"
  on subscriptions for update
  using (auth.uid() = user_id);

-- Create a policy that allows users to delete their own subscriptions
create policy "Users can delete their own subscriptions"
  on subscriptions for delete
  using (auth.uid() = user_id);
```

3. Set up Google OAuth in Supabase Authentication with access to Gmail API

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/subly.git
cd subly
```

2. Install dependencies:
```bash
npm install
```

3. Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

4. Edit `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Running the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
