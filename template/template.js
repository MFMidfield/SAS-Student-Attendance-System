// import { supabase } from "../../lib/supabaseClient";

// export function template(imageLogo, imageBander) {
//     const logoutBtn = document.getElementById('btn-logout');
//     const studentImage = document.getElementById('student-image');
//     const banderImage = document.getElementById('bander-image');
//     const studentNameElem = document.getElementById('student-name');

//     // Fetch user name from metadata
//     const fetchUserName = async () => {
//         const { data: { user } } = await supabase.auth.getUser();
//         if (user && user.user_metadata && studentNameElem) {
//             const { firstname, lastname } = user.user_metadata;
//             studentNameElem.textContent = `${firstname} ${lastname}`;
//         }
//     };
//     fetchUserName();

//     if (studentImage && imageLogo) {
//         studentImage.src = imageLogo;
//     }

//     if (banderImage && imageBander) {
//         banderImage.src = imageBander;
//     }
// }