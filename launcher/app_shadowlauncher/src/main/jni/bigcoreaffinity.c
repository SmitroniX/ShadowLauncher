//
// Created by maks on 19.06.2023.
//

#define _GNU_SOURCE // we are GNU GPLv3

#include <linux/limits.h>
#include <unistd.h>
#include <stdio.h>
#include <fcntl.h>
#include <stdlib.h>
#include <sched.h>
#include <string.h>

#define FREQ_MAX 256
void bigcore_format_cpu_path(char* buffer, unsigned int cpu_core) {
    snprintf(buffer, PATH_MAX, "/sys/devices/system/cpu/cpu%i/cpufreq/cpuinfo_max_freq", cpu_core);
}

void bigcore_set_affinity() {
    char path_buffer[PATH_MAX];
    char freq_buffer[FREQ_MAX];
    char* discard;
    unsigned long core_freq;
    unsigned long max_freq = 0;
    unsigned int corecnt = 0;
    unsigned long freqs[64];
    memset(freqs, 0, sizeof(freqs));

    while(corecnt < 64) {
        bigcore_format_cpu_path(path_buffer, corecnt);
        int corefreqfd = open(path_buffer, O_RDONLY);
        if(corefreqfd != -1) {
            ssize_t read_count = read(corefreqfd, freq_buffer, FREQ_MAX - 1);
            close(corefreqfd);
            if (read_count > 0) {
                freq_buffer[read_count] = 0;
                core_freq = strtoul(freq_buffer, &discard, 10);
                freqs[corecnt] = core_freq;
                if(core_freq > max_freq) {
                    max_freq = core_freq;
                }
            }
        }else{
            break;
        }
        corecnt++;
    }

    if (max_freq == 0 || corecnt == 0) return;

    cpu_set_t bigcore_affinity_set;
    CPU_ZERO(&bigcore_affinity_set);
    unsigned long threshold = (unsigned long)(max_freq * 0.80);
    unsigned int added = 0;
    for (unsigned int i = 0; i < corecnt; i++) {
        if (freqs[i] >= threshold) {
            CPU_SET_S(i, CPU_SETSIZE, &bigcore_affinity_set);
            added++;
        }
    }
    int result = sched_setaffinity(0, CPU_SETSIZE, &bigcore_affinity_set);
    if(result != 0) {
        printf("bigcore: setting affinity failed: %s\n", strerror(result));
    }else{
        printf("bigcore: distributed affinity across %u high-performance cluster cores (max %lu Hz)\n", added, max_freq);
    }
}