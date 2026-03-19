import streamlit as st
import requests
import pandas as pd

API_BASE = 'http://localhost:5000/api'

st.set_page_config(page_title='Student Activity Dashboard', layout='wide')
st.title('Student Achievement Monitoring Dashboard (HOD/Admin)')

role = st.sidebar.selectbox('Role', ['hod', 'admin'])

if role == 'hod':
    token = st.sidebar.text_input('JWT Token')
    if token:
        headers = {'Authorization': f'Bearer {token}'}
        summary = requests.get(f'{API_BASE}/hod/summary', headers=headers).json()
        st.subheader('Summary')
        st.metric('Total Students', summary.get('totalStudents', 0))
        st.metric('Total Activities', summary.get('totalActivities', 0))
        st.metric('Total Winners', summary.get('totalWinners', 0))
        st.metric('This Month', summary.get('thisMonth', 0))

        st.subheader('Leaderboard')
        leaderboard = requests.get(f'{API_BASE}/hod/leaderboard', headers=headers).json()
        df_leaderboard = pd.DataFrame(leaderboard)
        if not df_leaderboard.empty:
            df_leaderboard['name'] = df_leaderboard['student'].apply(lambda x: x['name'])
            st.dataframe(df_leaderboard[['name', 'points', 'participations', 'wins']].head(20))

        st.subheader('Activity categories')
        cats = requests.get(f'{API_BASE}/hod/activity-categories', headers=headers).json()
        st.write(cats)

elif role == 'admin':
    token = st.sidebar.text_input('JWT Token')
    if token:
        headers = {'Authorization': f'Bearer {token}'}
        pending = requests.get(f'{API_BASE}/admin/pending', headers=headers).json()
        st.subheader('Pending Submissions')
        st.dataframe(pd.DataFrame(pending))

        st.subheader('Generate Press Note (demo)')
        part_id = st.text_input('Participation ID')
        press_text = st.text_area('Custom text (optional)')
        if st.button('Generate') and part_id:
            payload = {'text': press_text}
            result = requests.post(f'{API_BASE}/admin/press-note/{part_id}', json=payload, headers=headers).json()
            st.json(result)
