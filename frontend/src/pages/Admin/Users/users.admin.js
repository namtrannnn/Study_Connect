import { useState, useEffect } from 'react';

import CustomTables from '../../../layout/Admin/components/Table/table2.admin';
import { convertDate } from '../../../helper/convertDate';

import * as UserService from '../../../services/user.services';

const fields = ['checkbox', 'no', 'avatar', 'name', 'email', 'postNumber', 'follower', 'following', 'status', 'date'];

const titles = ['Checkbox', 'No', 'Avatar', 'Name', 'Email', 'Posts', 'Follower', 'Following', 'Status', 'Date'];

const listCenterHead = ['No', 'Email', 'Posts', 'Follower', 'Following', 'Status', 'Date'];

const listCenterTd = ['postNumber', 'no', 'follower', 'following', 'status'];

export default function Users() {
    const [users, setUsers] = useState([]);
    useEffect(() => {
        const fetch = async () => {
            const res = await UserService.getUsers();
            console.log('res', res);
            setUsers(res.users);
        };
        fetch();
    }, []);
    const data = users.map((u, index) => {
        return {
            id: u._id,
            no: index + 1,
            email: u.email,
            name: u.fullName,
            avatar: u.avatar,
            postNumber: 'n/a',
            follower: u.follower?.length,
            following: u.following?.length,
            status: u.status,
            date: convertDate(u.createdAt),
        };
    });
    return (
        <div>
            <h4 className="text-2xl mt-5 mb-7">Người dùng</h4>

            <CustomTables
                fields={fields}
                titles={titles}
                data={data}
                listCenterHead={listCenterHead}
                listCenterTd={listCenterTd}
            />
        </div>
    );
}
