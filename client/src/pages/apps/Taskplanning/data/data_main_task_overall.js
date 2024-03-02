import { useEffect, useMemo, useState } from 'react';
import api from '_api';

const useNewPerson = (fetchData, fetchUser, fetchUserAll) => {
  const data = fetchData;
  const users = fetchUser;
  const all_users = fetchUserAll;

  const formattedData = useMemo(() => {
    const rows = [];

    if (data && data.length > 0 && users && all_users) {
      data.forEach((item) => {
        const new_send_to = JSON.parse(item.send_to);
        const check_all = users.some((item) => item.is_all === true);
        const newUsers = users.map((user) => user.user_id);
        const newGroup = users.map((user) => user.group_id);
        const AllUsers = new Map(fetchUserAll.map((user) => [user.user_id, `${user.first_name} ${user.last_name}`]));

        let assignNames = '';
        let createdByName = '';

        if (AllUsers) {
          createdByName = AllUsers.get(item.created_by) || '';
          let sendTo = new_send_to;
          if (typeof sendTo === 'string') {
            sendTo = JSON.parse(sendTo);
          }
          if (Array.isArray(sendTo)) {
            assignNames = sendTo.map((userId) => AllUsers.get(userId) || '').join(', ');
          }
        }

        if (check_all === true && assignNames && createdByName) {
          const row = {
            client_id: item.client_id,
            client_name: item.client_name,
            project_id: item.project_id,
            project_name: item.project_name,
            work_id: item.work_id,
            work_code: item.work_code,
            work_name: item.work_name,
            work_type: item.work_type,
            work_type_name: item.work_type_name,
            work_level: item.work_level,
            work_status: item.work_status,
            detail: item.detail,
            total: item.total,
            send_to: item.send_to,
            assign_name: assignNames,
            name_created: createdByName,
            action_status: item.action_status,
            stopwatch: item.sum_time,
            sum_time: item.stopwatch,
            start_date: item.start_date,
            end_date: item.end_date,
            created_date: item.created_date,
            is_active: item.is_active,
            is_deleted: item.is_deleted,
            created_by: item.created_by,
            group_id: item.group_id,
            my_create: newUsers.includes(item.created_by),
            my_assigned: Array.isArray(new_send_to) && new_send_to.some((id) => newUsers.includes(id))
          };
          rows.push(row);
          // console.log('rows', rows);
        } else if (newGroup == item.group_id && assignNames && createdByName) {
          const row = {
            client_id: item.client_id,
            client_name: item.client_name,
            project_id: item.project_id,
            project_name: item.project_name,
            work_id: item.work_id,
            work_code: item.work_code,
            work_name: item.work_name,
            work_type: item.work_type,
            work_type_name: item.work_type_name,
            work_level: item.work_level,
            work_status: item.work_status,
            assign_name: assignNames,
            name_created: createdByName,
            detail: item.detail,
            total: item.total,
            send_to: item.send_to,
            action_status: item.action_status,
            stopwatch: item.sum_time,
            sum_time: item.stopwatch,
            start_date: item.start_date,
            end_date: item.end_date,
            created_date: item.created_date,
            is_active: item.is_active,
            is_deleted: item.is_deleted,
            created_by: item.created_by,
            group_id: item.group_id,
            my_create: newUsers.includes(item.created_by),
            my_assigned: Array.isArray(new_send_to) && new_send_to.some((id) => newUsers.includes(id))
          };
          rows.push(row);
          // console.log('rows', rows);
        }
      });
    }

    return rows;
  }, [data, users, all_users]);

  const sortedData = formattedData.slice().sort((a, b) => {
    // Convert the date strings to Date objects for comparison
    const dateA = new Date(a.created_date);
    const dateB = new Date(b.created_date);

    // Compare the dates in descending order
    return dateA - dateB;
  });

  // Set autoNumber based on the sorted order
  sortedData.forEach((row, index) => {
    row.autoNumber = index + 1;
  });

  return sortedData;
};

export default useNewPerson;
