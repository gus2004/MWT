CREATE TEMP TABLE usuarios_importados AS
SELECT * FROM usuarios WITH NO DATA;

COPY public.usuarios (id, email, password, nombre, apellido, esta_activo, ultimo_login, fecha_creacion, fecha_cambio_pw) FROM stdin;
pil-u-01	pedro.garcia@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Pedro	GarcÃ­a	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-02	juan.herrera@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Juan	Herrera	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-03	luis.martinez@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Luis	MartÃ­nez	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-04	andres.lopez@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	AndrÃ©s	LÃ³pez	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-05	diego.ramos@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Diego	Ramos	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-06	carlos.perez@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Carlos	PÃ©rez	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-07	fernando.cruz@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Fernando	Cruz	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-08	miguel.torres@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Miguel	Torres	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-09	jose.vasquez@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	JosÃ©	VÃ¡squez	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-10	alejandro.ruiz@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Alejandro	Ruiz	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-11	mario.castillo@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Mario	Castillo	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-12	rodrigo.morales@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Rodrigo	Morales	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-13	pablo.jimenez@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Pablo	JimÃ©nez	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-14	oscar.mendez@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Oscar	MÃ©ndez	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-15	victor.reyes@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	VÃ­ctor	Reyes	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-16	hector.aguilar@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	HÃ©ctor	Aguilar	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-17	kimberly.ramirez@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Kimberly	RamÃ­rez	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-18	raul.gonzalez@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	RaÃºl	GonzÃ¡lez	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-19	sergio.ramirez@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Sergio	RamÃ­rez	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
pil-u-20	maria.arevalo@gmail.com	$2b$10$ntYtXuSgZgxSZ7D4tg9fcOQt9dl4SJKn7dkqo.gROCijCIW4U9Yi.	Maria Jose	ArÃ©valo	t	\N	2026-05-20 23:39:06.873	2026-05-20 23:39:06.873
usr-admin	admin@acmg.gt	$2b$10$R9KigkLHDHK9SS7wwE.iR.pV3b.sUDyE5WFxLOx2aFLxymWu1.pBS	Carlos	Mendoza	t	2026-08-19 14:59:37.377	2026-05-20 23:39:06.873	2026-08-19 14:59:37.397
f98c3274-9c2b-479c-90eb-285b20855d2d	e2e.test@example.com	$2b$10$5yHvH2nS3DTbZH5cq8aCY.v7MuggALbXhWmOqBgemIG83o.5fLOI2	E2E	Test	f	\N	2026-08-19 14:59:49.827	2026-08-19 15:00:25.679
e2661597-9c39-4bc8-a7e5-7928bb0b6e11	e2e.test2@example.com	$2b$10$9EmMpJxGY0htFQjghA9AcO8PIcbCFPZHJhfOA7EYtxpXhGM1lh0CW	E2E2	Test	f	\N	2026-08-19 15:00:32.234	2026-08-19 15:00:32.416
25332652-7bdf-4697-a2b0-c1813d002760	sandratorres@gmail.com	$2b$10$VMzYaEQCPoXxVsTrnrhBJutFA3pKzd56kFNYRMACuRUkD2LZspBom	SANDRA	TORRES	t	2026-09-21 04:18:51.019	2026-09-04 19:46:41.406	2026-09-21 04:18:51.035
bf0be7bc-3cc0-4e64-8e01-672861fa6d52	staff@mwt.gt	$2b$10$muf.LQLl9purgtOCvPiNge5PIshUY1zN2AEkQ7h4R4lsKo/ZdWKfa	Staff	Tecnico	t	2026-09-07 01:15:52.696	2026-08-30 23:42:59.729	2026-09-07 01:15:52.698
bf0fdaf8-ea11-4f38-bdbf-8ba56154831c	mceballos@gmail.com	$2b$10$Cug81kM6Aga4JAxjXY2.SesTJgDWxQFvrMZX02QtNHEBe7YU.XvNy	Michael	Ceballos	t	\N	2026-05-23 02:20:44.869	2026-05-23 02:20:44.87
ce4bfd6e-d3c3-4c91-b043-448e71ea4f9a	gaparicio@gmail.com	$2b$10$l76Bn0ypgxZ1Wl7DBjjmDO6KIIWNjhKRuF5c.JpNDjZKSz0yCNbSe	Gabriel	Aparicio	f	\N	2026-07-27 14:09:22.447	2026-07-27 14:09:52.744
acd4423a-028f-4643-a9d2-e85028d41c8a	jhgasasasa@gmail.com	$2b$10$i.CyqAGm82DN9U4MkFvnLenavLXGVb0F7ZZfT1UE3ydAOgvx28Jj6	AGUSTIN	RODRIGUEZ	t	\N	2026-07-27 16:15:21.514	2026-07-27 16:15:21.516
4932b935-1bbd-4bae-8bc1-b29d02fe63ef	dfigueroa@gmail.com	$2b$10$cLieTVal4zjHkPKQ2G3eMu.X176b6j7h8zPPHwSKuw.1PL90wu9J.	DANIEL	FIGUEROA	t	\N	2026-08-03 13:58:28.11	2026-08-03 13:58:28.111
usr-staff	recepcion@acmg.gt	$2b$10$R9KigkLHDHK9SS7wwE.iR.pV3b.sUDyE5WFxLOx2aFLxymWu1.pBS	MarÃ­a	LÃ³pez	t	\N	2026-05-20 23:39:06.873	2026-08-19 14:59:34.034
29bd2f86-00b8-4aef-8b4a-8a21e2092fcd	testpiloto2@mwt.gt	$2b$10$jaSciNsDV3ZxZ7.fFsRMWuLFQBIA1gwJ1A4v362/2VU0HfJIPEvgy	Test2	Piloto	f	2026-08-31 00:08:32.079	2026-08-31 00:08:20.737	2026-08-31 00:09:16.272
usr-comis	comisario@acmg.gt	$2b$10$R9KigkLHDHK9SS7wwE.iR.pV3b.sUDyE5WFxLOx2aFLxymWu1.pBS	Roberto	JuÃ¡rez	t	\N	2026-05-20 23:39:06.873	2026-08-19 14:59:34.034
usr-juez	cronometro@acmg.gt	$2b$10$R9KigkLHDHK9SS7wwE.iR.pV3b.sUDyE5WFxLOx2aFLxymWu1.pBS	Andrea	Castillo	t	\N	2026-05-20 23:39:06.873	2026-08-19 14:59:34.034
e820e718-62a1-467f-a504-62753cd16e31	juez@mwt.gt	$2b$10$muf.LQLl9purgtOCvPiNge5PIshUY1zN2AEkQ7h4R4lsKo/ZdWKfa	Juez	Mesa	t	2026-08-30 23:47:05.984	2026-08-30 23:42:59.721	2026-08-30 23:47:05.986
928464d6-00f5-41b6-9e72-ea1e5d506e66	nuevostaff@mwt.gt	$2b$10$94SC66hGv6gCIMmcGAWaLuawz0EYRi4Wsyu91L9zLqZhxvdIWR3pq	NuevoStaff	Equipo	f	\N	2026-08-31 00:08:38.799	2026-08-31 00:09:16.264
7934425f-13dd-406d-bb8e-d6a292f5ed74	gbarrientosg1@miumg.edu.gt	$2b$10$N/gszA5lpWzlxEc6tGcyBujn0AthipGJodO5ppbrSkv6SNp4OuAii	Gustavo	Barrientos	t	2026-08-30 23:54:28.87	2026-05-21 18:20:25.608	2026-08-30 23:54:28.873
235f2006-67c6-4d50-9e15-4f4d094e6827	testpiloto@mwt.gt	$2b$10$F/.NgpoYFn8DxWM0ItVPCOCN0k3s5KJ6PPMcIaunARsCc7VQdxL5e	Test	Piloto	f	\N	2026-08-31 00:07:56.086	2026-08-31 00:09:16.279
188dcded-0eae-48e5-b93b-b085b4313f71	arielg@gmail.com	$2b$10$6zGyhRVhCHygYdNUAKyKUuXRAOHTKE0CTguWpZj67WJMHiZZ5pMC6	Ariel	Garcia	t	2026-08-31 00:16:25.855	2026-08-31 00:14:19.609	2026-08-31 00:17:28.469
181ec4be-9969-4f83-9e9b-096672d2b86f	susanm@gmail.com	$2b$10$QrvgwCTR0s8miPGn85DXzOplpmqwZa7hc85FL2VKawYl9JvX8HPTG	SUSAN	MARROQUIN	t	\N	2026-08-31 01:48:06.367	2026-08-31 01:48:06.369
6a461f7e-873d-46c1-8965-85dd7aa479ab	comisario@mwt.gt	$2b$10$Hlvma6zSclAEJj.Ts7l9G.3AQN1WroDTk/GQMhINq14cBISTfryrC	Comisario	MWT	t	2026-09-21 04:20:02.493	2026-08-30 23:42:59.714	2026-09-21 04:20:02.496
cc3a6098-e94f-41b3-8dc6-cb82ada812c8	admin@mwt.gt	$2b$10$XviDiaNFeoSdoZGcmEGlqOjNw7qqR/sHKMGoclaGW6iOmisb.kvUO	Admin	MWT	t	2026-10-29 01:24:38.689	2026-08-30 23:42:59.642	2026-10-29 01:24:38.702
b5f6e13b-8c29-4fa8-83ef-d61242f2f34f	piloto@mwt.gt	$2b$10$muf.LQLl9purgtOCvPiNge5PIshUY1zN2AEkQ7h4R4lsKo/ZdWKfa	Piloto	Demo	t	2026-09-07 01:00:06.4	2026-08-30 23:42:59.733	2026-09-07 01:00:06.407
e9f80104-d0a1-4e14-86df-f14e05169de3	abc@gmail.com	$2b$10$KWWVIMrVVmoOJjv49/jOf.60HCS4cUv6jVTzs51fHgdlnygpE90YK	WILL	TERCERO	t	2026-09-07 01:48:25.545	2026-09-07 01:35:34.563	2026-09-07 01:48:25.547
7e7393a0-d67c-4c19-bed2-d9fbb25fa4ae	sara@gmail.com	$2b$10$Gn4mBqfhMSI3QLcezNEGNu4a1asCs8IXPVR9w5t/A9FbaQbgtq/ZC	Sarai	Bonilla	t	2026-09-09 14:43:14.935	2026-09-09 14:43:04.455	2026-09-09 14:43:14.938
49de7aea-1e5d-44d2-a9ad-677baa3522d1	Saraimon@gmail.com	$2b$10$y5xuaxJvLlD8Our0Ll9YDetN.21N23Xcp7rDq2WQ8y3jBmOdZcX7m	Sarai	Montufar	t	\N	2026-09-13 23:37:43.727	2026-09-13 23:37:43.727
5d9b01db-de71-488a-a175-34a316adbfe4	gbarris@miumg.edu.gt	$2b$10$6pmZLQw0IRM/8F1xLnd.zuV5.WeCQjqvdTTrdWsPPuJqzLSCM/v.m	GUSTAVO	GARCIA	t	2026-09-14 03:45:24.217	2026-05-21 19:44:37.055	2026-09-14 03:45:24.219
aa3a3fb0-cb7a-457e-a43e-612e3e62b729	lilia@gmail.com	$2b$10$ZLe5gB310JcdknJ0Pry5/OA./ozcT58gcIvQ0VsOHRyrJv3JHstAe	LILIA	BELTRAN	t	2026-09-14 03:45:45.876	2026-09-13 23:23:25.765	2026-09-14 03:45:45.877
99d7c9b4-6be6-4c94-9125-5c5f4ce2eb16	xiomara@gmail.com	$2b$10$zuMHBUd9uxWclY9kopTq1Ouuz/oSJEEH0uqjx25Cr7X00Ih7.4B5q	Xiomara	Enriquez	t	\N	2026-09-14 03:48:44.972	2026-09-14 03:48:44.976
00c5945d-ae51-49bc-a585-0c792b2a45e6	jose@gmail.com	$2b$10$kKV2z7CVec6WQiLbUz5uMetr/8oN.VzbRWwDQ/VL/OJzqddpS2CIm	Jose	Herrera	t	2026-09-14 17:21:29.547	2026-09-14 17:21:20.531	2026-09-14 17:21:29.549
5c2ed4c6-8769-4699-91bf-bc61150d0f37	saravin@yahooo.com	$2b$10$NqgsnJi3VGO3YAPs0lKHZuupELEa6y1.gGrF90NrurXtUiuvj/HFm	Jeffry	Urbina	t	2026-09-16 02:34:30.497	2026-09-16 02:24:38.633	2026-09-16 02:34:30.5
20d6e041-9399-4373-874b-af6922811bf7	dani@gmail.com	$2b$10$0cIcn70v2KRLZ8uWMLyhHu/nSFSZO2LujGzVjfQOTUFqL/XMRSb8W	Daniel	Figueroa	t	2026-09-14 17:20:47.473	2026-09-14 17:19:48.981	2026-09-16 02:46:25.127
85dab1b1-7a2a-4ebd-bb62-adea5b4fbb0b	jfigueroah4@miug.edu.gt	$2b$10$hcrXUt5lMOSI1Kq6GUTT4..EsjHZ4Y1JFwfE1OTykXI8fS/bGIHNq	Jorge Arturo	Figueroa Miranda	t	2026-09-16 18:05:44.223	2026-09-16 02:38:24.837	2026-09-16 18:05:44.225
f4276a72-1138-49f1-b210-bd46d1484d57	jurbinas@miumg.edu.gt	$2b$10$8vkD4Osx9E3C83slQS4zY.x7FmWaF8jOd.48m8xhpF9s4fG9BpZ7K	JEFFRY	SARAVIA	t	\N	2026-09-22 03:37:26.786	2026-09-22 03:37:26.788
aafb5462-269d-47a8-8319-dab9c71a9f75	franc@gmail.com	$2b$10$gYkEki1t/zomnUpIv2GbruvSYF6OuGK3rVTMPQDunG9mHwrQkAE0S	Francisco	ZuÃ‘Iga	t	\N	2026-09-28 01:45:35.804	2026-09-28 01:45:35.804
\.


INSERT INTO usuarios
SELECT *
FROM usuarios_importados
ON CONFLICT DO NOTHING;
